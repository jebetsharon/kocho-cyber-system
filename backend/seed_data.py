"""
Database seeder script to populate initial data
Run this after creating the database tables

Usage: 
docker-compose exec backend python seed_data.py
"""

from app import create_app, db
from app.models import User, Service, InventoryItem

app = create_app()

def seed_users():
    """Create initial users"""
    print("Creating users...")
    
    # Check if owner exists
    owner = User.query.filter_by(username='admin').first()
    if not owner:
        owner = User(
            username='admin',
            email='kochoprinters@gmail.com',
            full_name='System Administrator',
            role='owner',
            phone='0724444979'
        )
        owner.set_password('admin123')  # Change this in production!
        db.session.add(owner)
        print("✓ Owner account created (username: admin, password: admin123)")
    
    # Create sample employees
    employees = [
        {'username': 'emp1', 'name': 'Employee One', 'email': 'emp1@kocho.com'},
        {'username': 'emp2', 'name': 'Employee Two', 'email': 'emp2@kocho.com'},
        {'username': 'emp3', 'name': 'Employee Three', 'email': 'emp3@kocho.com'},
    ]
    
    for emp in employees:
        if not User.query.filter_by(username=emp['username']).first():
            employee = User(
                username=emp['username'],
                email=emp['email'],
                full_name=emp['name'],
                role='employee',
                phone=''
            )
            employee.set_password('employee123')  # Change this in production!
            db.session.add(employee)
            print(f"✓ Employee account created ({emp['username']})")
    
    db.session.commit()


def seed_services():
    """Create initial services"""
    print("\nCreating services...")
    
    services = [
        # Printing Services
        {'name': 'A4 Black & White Printing', 'category': 'printing', 'price': 5.0, 'unit': 'per_page'},
        {'name': 'A4 Color Printing', 'category': 'printing', 'price': 20.0, 'unit': 'per_page'},
        {'name': 'A3 Black & White Printing', 'category': 'printing', 'price': 10.0, 'unit': 'per_page'},
        {'name': 'A3 Color Printing', 'category': 'printing', 'price': 40.0, 'unit': 'per_page'},
        {'name': 'Binding Services', 'category': 'printing', 'price': 50.0, 'unit': 'per_project'},
        {'name': 'Lamination A4', 'category': 'printing', 'price': 50.0, 'unit': 'per_page'},
        
        # Scanning
        {'name': 'Document Scanning', 'category': 'scanning', 'price': 10.0, 'unit': 'per_page'},
        {'name': 'Photocopying A4', 'category': 'scanning', 'price': 5.0, 'unit': 'per_page'},
        
        # Graphic Design
        {'name': 'Logo Design', 'category': 'graphic_design', 'price': 2000.0, 'unit': 'per_project'},
        {'name': 'Business Card Design', 'category': 'graphic_design', 'price': 500.0, 'unit': 'per_project'},
        {'name': 'Poster Design', 'category': 'graphic_design', 'price': 1000.0, 'unit': 'per_project'},
        {'name': 'Banner Design', 'category': 'graphic_design', 'price': 1500.0, 'unit': 'per_project'},
        
        # Web Development
        {'name': 'Basic Website', 'category': 'web_development', 'price': 15000.0, 'unit': 'per_project'},
        {'name': 'E-commerce Website', 'category': 'web_development', 'price': 50000.0, 'unit': 'per_project'},
        {'name': 'Website Maintenance', 'category': 'web_development', 'price': 2000.0, 'unit': 'per_month'},
        
        # CCTV
        {'name': 'CCTV Installation (4 cameras)', 'category': 'cctv', 'price': 25000.0, 'unit': 'per_project'},
        {'name': 'CCTV Installation (8 cameras)', 'category': 'cctv', 'price': 45000.0, 'unit': 'per_project'},
        {'name': 'CCTV Maintenance', 'category': 'cctv', 'price': 1500.0, 'unit': 'per_visit'},
        
        # Other Services
        {'name': 'Typing Services', 'category': 'other', 'price': 50.0, 'unit': 'per_page'},
        {'name': 'CV Writing', 'category': 'other', 'price': 500.0, 'unit': 'per_project'},
    ]
    
    for service_data in services:
        if not Service.query.filter_by(name=service_data['name']).first():
            service = Service(
                name=service_data['name'],
                category=service_data['category'],
                base_price=service_data['price'],
                unit=service_data['unit'],
                description=f"{service_data['name']} - {service_data['category']}"
            )
            db.session.add(service)
            print(f"✓ Service created: {service_data['name']}")
    
    db.session.commit()


def seed_inventory():
    """Create initial inventory items"""
    print("\nCreating inventory items...")
    
    items = [
        # Stationery
        {'name': 'A4 Paper Ream', 'category': 'stationery', 'sku': 'A4-REAM-001', 'qty': 50, 'min': 10, 'cost': 450, 'price': 550},
        {'name': 'Pens (Blue)', 'category': 'stationery', 'sku': 'PEN-BLUE-001', 'qty': 100, 'min': 20, 'cost': 10, 'price': 20},
        {'name': 'Pens (Black)', 'category': 'stationery', 'sku': 'PEN-BLACK-001', 'qty': 100, 'min': 20, 'cost': 10, 'price': 20},
        {'name': 'Notebooks', 'category': 'stationery', 'sku': 'NOTEBOOK-001', 'qty': 50, 'min': 10, 'cost': 50, 'price': 80},
        {'name': 'Stapler', 'category': 'stationery', 'sku': 'STAPLER-001', 'qty': 20, 'min': 5, 'cost': 100, 'price': 150},
        {'name': 'Staples Box', 'category': 'stationery', 'sku': 'STAPLES-001', 'qty': 30, 'min': 10, 'cost': 30, 'price': 50},
        
        # Supplies
        {'name': 'Toner Cartridge (Black)', 'category': 'supplies', 'sku': 'TONER-BLK-001', 'qty': 5, 'min': 2, 'cost': 3000, 'price': 4000},
        {'name': 'Toner Cartridge (Color)', 'category': 'supplies', 'sku': 'TONER-CLR-001', 'qty': 5, 'min': 2, 'cost': 4000, 'price': 5500},
        {'name': 'Laminating Sheets A4', 'category': 'supplies', 'sku': 'LAM-A4-001', 'qty': 100, 'min': 20, 'cost': 15, 'price': 30},
        {'name': 'Binding Covers', 'category': 'supplies', 'sku': 'BIND-COV-001', 'qty': 50, 'min': 10, 'cost': 20, 'price': 40},
        {'name': 'Binding Combs', 'category': 'supplies', 'sku': 'BIND-COMB-001', 'qty': 100, 'min': 20, 'cost': 5, 'price': 10},
    ]
    
    for item_data in items:
        if not InventoryItem.query.filter_by(sku=item_data['sku']).first():
            item = InventoryItem(
                name=item_data['name'],
                category=item_data['category'],
                sku=item_data['sku'],
                quantity=item_data['qty'],
                min_quantity=item_data['min'],
                unit_price=item_data['cost'],
                selling_price=item_data['price'],
                supplier='General Supplier'
            )
            db.session.add(item)
            print(f"✓ Inventory item created: {item_data['name']}")
    
    db.session.commit()


def main():
    """Main seeder function"""
    with app.app_context():
        print("=" * 60)
        print("KOCHO PRINTERS & CYBER LTD - DATABASE SEEDER")
        print("=" * 60)
        
        seed_users()
        seed_services()
        seed_inventory()
        
        print("\n" + "=" * 60)
        print("✓ Database seeding completed successfully!")
        print("=" * 60)
        print("\nDefault Login Credentials:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\n⚠️  IMPORTANT: Change the default password in production!")
        print("=" * 60)


if __name__ == '__main__':
    main()