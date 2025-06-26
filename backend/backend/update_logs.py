#!/usr/bin/env python3
"""
Domain API dosyasındaki tüm log kayıtlarına operation_type ekleyen script
"""

import re

def update_domain_api_logs():
    with open('domain_api.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Endpoint'lere göre operation_type mapping
    mappings = {
        '/delete_domain': 'domain',
        '/update_user': 'user', 
        '/add_department': 'department',
        '/update_department': 'department',
        '/delete_department': 'department'
    }
    
    # Her mapping için log kayıtlarını güncelle
    for endpoint, op_type in mappings.items():
        # endpoint pattern'i bul
        pattern = rf'(APILogger\.log_operation\s*\(\s*endpoint="{re.escape(endpoint)}",\s*method="[^"]+",)(\s*)'
        replacement = rf'\1\2operation_type="{op_type}",\2'
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    with open('domain_api.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Domain API log kayıtları güncellendi!")

if __name__ == "__main__":
    update_domain_api_logs()
