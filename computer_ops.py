# ✅ Bilgisayarı departmana atayan fonksiyon
def assign_computer_to_department(conn, computer_name, department):
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM computers WHERE name = %s", (computer_name,))
    if cursor.fetchone() is None:
        print(f"❌ Bilgisayar bulunamadı: {computer_name}")
        return

    valid_departments = ['muhasebe', 'IT', 'İK', 'yönetim', 'idari işler']
    if department not in valid_departments:
        print(f"❌ Geçersiz departman: {department}")
        print(f"📋 Geçerli departmanlar: {', '.join(valid_departments)}")
        return

    cursor.execute(
        "UPDATE computers SET department = %s WHERE name = %s",
        (department, computer_name)
    )
    conn.commit()
    print(f"✅ {computer_name} adlı bilgisayar '{department}' departmanına atandı.")


# ✅ Departmana göre bilgisayar listeleyen fonksiyon
def list_computers_by_department(conn, department):
    cursor = conn.cursor()

    valid_departments = ['muhasebe', 'IT', 'İK', 'yönetim', 'idari işler']
    if department not in valid_departments:
        print(f"❌ Geçersiz departman: {department}")
        print(f"📋 Geçerli departmanlar: {', '.join(valid_departments)}")
        return

    cursor.execute("SELECT name, operating_system FROM computers WHERE department = %s", (department,))
    rows = cursor.fetchall()

    if not rows:
        print(f"⚠️ '{department}' departmanına ait kayıtlı bilgisayar yok.")
    else:
        print(f"\n📋 '{department}' departmanındaki bilgisayarlar:")
        for name, os in rows:
            print(f"🖥️ {name} - {os}")
