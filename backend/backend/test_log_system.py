"""
🧪 API Log Sistemi Test Uygulaması
Bu dosya log sisteminin çalıştığını test eder
"""

import requests
import json

# API base URL
BASE_URL = "http://localhost:8000"

def test_api_calls():
    """API çağrıları yaparak log sistemi test eder"""
    
    print("🧪 API Log Sistemi Test Başlatılıyor...")
    print("=" * 50)
    
    # 0. Test log endpoint'i
    print("\n0️⃣ Test log endpoint'i çağrılıyor...")
    try:
        response = requests.get(f"{BASE_URL}/api/test-log")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Test: {data.get('success', False)}")
            print(f"   Mesaj: {data.get('message', 'N/A')}")
        else:
            print(f"   Hata: {response.text}")
    except Exception as e:
        print(f"   Bağlantı hatası: {e}")
    
    # 1. Domain listeleme testi
    print("\n1️⃣ Domain listeleme API'si test ediliyor...")
    try:
        response = requests.get(f"{BASE_URL}/list_domains?user_id=test-user-123")
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Domain sayısı: {len(data.get('domains', []))}")
        else:
            print(f"   Hata: {response.text}")
    except Exception as e:
        print(f"   Bağlantı hatası: {e}")
    
    # 2. Kullanıcı ekleme testi (başarısız olması normal)
    print("\n2️⃣ Kullanıcı ekleme API'si test ediliyor...")
    try:
        user_data = {
            "username": "test_user_log",
            "first_name": "Test",
            "last_name": "User",
            "password": "test123",
            "role_id": 1,
            "domain_id": 1
        }
        response = requests.post(f"{BASE_URL}/add_user", json=user_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Başarı: {data.get('success', False)}")
        else:
            print(f"   Hata: {response.text}")
    except Exception as e:
        print(f"   Bağlantı hatası: {e}")

def view_logs():
    """Log kayıtlarını görüntüler"""
    
    print("\n📊 Log Kayıtları Görüntüleniyor...")
    print("=" * 50)
    
    try:
        # Son 10 log kaydını getir
        response = requests.get(f"{BASE_URL}/api/logs?limit=10")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                logs = data.get("logs", [])
                total = data.get("total_count", 0)
                
                print(f"\n📈 Toplam log sayısı: {total}")
                print(f"📋 Son {len(logs)} kayıt:\n")
                
                for i, log in enumerate(logs, 1):
                    status = "✅" if log.get("success") else "❌"
                    endpoint = log.get("endpoint", "N/A")
                    method = log.get("method", "N/A")
                    created_at = log.get("created_at", "N/A")[:19] if log.get("created_at") else "N/A"
                    error_msg = log.get("error_message", "")
                    
                    print(f"{i:2}. {status} {created_at} | {method:6} | {endpoint:25}")
                    if error_msg:
                        print(f"     ⚠️  Hata: {error_msg}")
                
            else:
                print(f"❌ Log getirme hatası: {data.get('message', 'Bilinmeyen hata')}")
        else:
            print(f"❌ API Hatası: {response.status_code}")
            print(f"   Yanıt: {response.text}")
            
    except Exception as e:
        print(f"❌ Bağlantı hatası: {e}")

def show_log_filters():
    """Log filtreleme örnekleri gösterir"""
    
    print("\n🔍 Log Filtreleme Örnekleri:")
    print("=" * 50)
    
    print("🔹 Belirli endpoint'i filtrele:")
    print("   GET /api/logs?endpoint=add_user")
    
    print("\n🔹 Belirli kullanıcının logları:")
    print("   GET /api/logs?user_id=test-user-123")
    
    print("\n🔹 Son 5 kayıt:")
    print("   GET /api/logs?limit=5")
    
    print("\n🔹 Sadece başarısız işlemler:")
    print("   GET /api/logs?success=false")

if __name__ == "__main__":
    print("🚀 ODIE Backend API Log Sistemi Test")
    print("=" * 60)
    
    try:
        # Test API çağrıları yap
        test_api_calls()
        
        # Log kayıtlarını görüntüle
        view_logs()
        
        # Filtreleme örnekleri göster
        show_log_filters()
        
        print("\n✅ Test tamamlandı!")
        print("\n📖 Log endpoint'i: GET /api/logs")
        print("💡 Sunucuyu başlatmak için: uvicorn server:app --reload --port 8000")
        
    except KeyboardInterrupt:
        print("\n⚠️ Test durduruldu.")
    except Exception as e:
        print(f"\n❌ Test hatası: {e}")
        print("\n🔧 Sunucunun çalıştığından emin olun:")
        print("   uvicorn server:app --reload --port 8000")
