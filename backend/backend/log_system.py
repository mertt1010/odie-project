import json
import time
from datetime import datetime
from typing import Optional, Dict, Any
from db_ops import get_db_connection

class APILogger:
    """API işlemlerini log'lamak için basit sınıf"""
    
    @staticmethod
    def log_operation(
        endpoint: str,
        method: str,
        operation_type: Optional[str] = None,
        user_id: Optional[str] = None,
        domain_id: Optional[int] = None,
        request_data: Optional[Dict[Any, Any]] = None,
        response_data: Optional[Dict[Any, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ):
        """
        API işlemini veritabanında log'lar - Sadece POST, DELETE, PUT işlemleri loglanır
        
        Args:
            endpoint: API endpoint yolu
            method: HTTP method
            operation_type: İşlem türü (domain, user, department, login, other)
            user_id: Kullanıcı ID'si
            domain_id: Domain ID'si
            request_data: Request verisi
            response_data: Response verisi
            success: İşlem başarılı mı
            error_message: Hata mesajı
        """
        # Sadece POST, DELETE, PUT işlemlerini logla
        if method.upper() not in ['POST', 'DELETE', 'PUT']:
            return True  # GET işlemleri loglanmaz
        
        # Operation type otomatik belirleme (verilmemişse)
        if not operation_type:
            operation_type = APILogger._determine_operation_type(endpoint)
            
        try:
            conn = get_db_connection()
            if not conn:
                print("❌ Log kaydı için veritabanı bağlantısı kurulamadı")
                return False
                
            cursor = conn.cursor()
            
            # JSON verilerini string'e çevir
            request_json = json.dumps(request_data, ensure_ascii=False) if request_data else None
            response_json = json.dumps(response_data, ensure_ascii=False) if response_data else None
            
            # Log kaydını ekle
            cursor.execute("""
                INSERT INTO api_logs (
                    endpoint, method, operation_type, user_id, domain_id, request_data, 
                    response_data, success, error_message
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                endpoint, method, operation_type, user_id, domain_id, request_json,
                response_json, success, error_message
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Log kaydetme hatası: {e}")
            return False

    @staticmethod
    def _determine_operation_type(endpoint: str) -> str:
        """
        Endpoint'e göre operation type'ı otomatik belirler
        
        Args:
            endpoint: API endpoint yolu
            
        Returns:
            str: Operation type (domain, user, department, login, other)
        """
        endpoint_lower = endpoint.lower()
        
        if 'domain' in endpoint_lower:
            return 'domain'
        elif any(keyword in endpoint_lower for keyword in ['user', 'kullanici']):
            return 'user'
        elif any(keyword in endpoint_lower for keyword in ['department', 'departman']):
            return 'department'
        elif any(keyword in endpoint_lower for keyword in ['login', 'auth', 'signin', 'giris']):
            return 'login'
        else:
            return 'other'

    @staticmethod
    def get_logs(
        user_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        operation_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ):
        """
        Log kayıtlarını getirir
        
        Args:
            user_id: Kullanıcı ID'si filtresi
            endpoint: Endpoint filtresi
            operation_type: İşlem türü filtresi (domain, user, department, login, other)
            limit: Maksimum kayıt sayısı
            offset: Kayıt başlangıç pozisyonu
        
        Returns:
            Dict: Log kayıtları
        """
        try:
            conn = get_db_connection()
            if not conn:
                return {"success": False, "message": "Veritabanı bağlantısı kurulamadı"}
                
            cursor = conn.cursor()
            
            # Dinamik WHERE koşulları oluştur
            where_conditions = []
            params = []
            
            if user_id:
                where_conditions.append("user_id = %s")
                params.append(user_id)
                
            if endpoint:
                where_conditions.append("endpoint ILIKE %s")
                params.append(f"%{endpoint}%")
                
            if operation_type:
                where_conditions.append("operation_type = %s")
                params.append(operation_type)
            
            # WHERE clause oluştur
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            # Toplam kayıt sayısını al
            count_query = f"SELECT COUNT(*) FROM api_logs {where_clause}"
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]
            
            # Log kayıtlarını al
            query = f"""
                SELECT id, endpoint, method, operation_type, user_id, domain_id, request_data, 
                       response_data, success, error_message, created_at
                FROM api_logs 
                {where_clause}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """
            
            params.extend([limit, offset])
            cursor.execute(query, params)
            logs = cursor.fetchall()
            conn.close()
            
            # Log kayıtlarını formatla
            log_list = []
            for log in logs:
                # PostgreSQL JSONB alanları zaten dict olarak dönüyor
                request_data = log[6] if log[6] else None
                response_data = log[7] if log[7] else None
                
                # Eğer string ise JSON parse et, dict ise olduğu gibi bırak
                if isinstance(request_data, str):
                    try:
                        request_data = json.loads(request_data)
                    except:
                        request_data = None
                        
                if isinstance(response_data, str):
                    try:
                        response_data = json.loads(response_data)
                    except:
                        response_data = None
                
                log_dict = {
                    "id": log[0],
                    "endpoint": log[1],
                    "method": log[2],
                    "operation_type": log[3],
                    "user_id": log[4],
                    "domain_id": log[5],
                    "request_data": request_data,
                    "response_data": response_data,
                    "success": log[8],
                    "error_message": log[9],
                    "created_at": log[10].isoformat() if log[10] else None
                }
                log_list.append(log_dict)
            
            return {
                "success": True,
                "logs": log_list,
                "total_count": total_count,
                "limit": limit,
                "offset": offset
            }
            
        except Exception as e:
            print(f"❌ Log getirme hatası: {e}")
            return {"success": False, "message": f"Log getirme hatası: {e}"}
