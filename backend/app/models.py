from datetime import datetime
from app import db
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # owner, employee
    phone = db.Column(db.String(15))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'full_name': self.full_name,
            'role': self.role,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # printing, scanning, graphic_design, web_dev, cctv
    description = db.Column(db.Text)
    base_price = db.Column(db.Float, default=0.0)
    unit = db.Column(db.String(20))  # per_page, per_hour, per_project
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'description': self.description,
            'base_price': self.base_price,
            'unit': self.unit,
            'is_active': self.is_active
        }


class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(15), unique=True, nullable=False)
    address = db.Column(db.Text)
    account_balance = db.Column(db.Float, default=0.0)
    total_spent = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_visit = db.Column(db.DateTime)
    
    orders = db.relationship('Order', backref='customer', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'account_balance': self.account_balance,
            'total_spent': self.total_spent,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_visit': self.last_visit.isoformat() if self.last_visit else None
        }


class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # stationery, supplies, equipment
    sku = db.Column(db.String(50), unique=True)
    quantity = db.Column(db.Integer, default=0)
    min_quantity = db.Column(db.Integer, default=10)
    unit_price = db.Column(db.Float, nullable=False)
    selling_price = db.Column(db.Float, nullable=False)
    supplier = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def is_low_stock(self):
        return self.quantity <= self.min_quantity
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category': self.category,
            'sku': self.sku,
            'quantity': self.quantity,
            'min_quantity': self.min_quantity,
            'unit_price': self.unit_price,
            'selling_price': self.selling_price,
            'supplier': self.supplier,
            'is_low_stock': self.is_low_stock
        }


class Order(db.Model):
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(20), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    discount = db.Column(db.Float, default=0.0)
    final_amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)  # cash, mpesa, card
    payment_status = db.Column(db.String(20), default='pending')  # pending, paid, partial
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, cancelled
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer': self.customer.to_dict() if self.customer else None,
            'user_id': self.user_id,
            'total_amount': self.total_amount,
            'discount': self.discount,
            'final_amount': self.final_amount,
            'payment_method': self.payment_method,
            'payment_status': self.payment_status,
            'status': self.status,
            'notes': self.notes,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class OrderItem(db.Model):
    __tablename__ = 'order_items'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    item_type = db.Column(db.String(20), nullable=False)  # service, product
    item_id = db.Column(db.Integer)  # service_id or inventory_item_id
    item_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, default=1)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    specifications = db.Column(db.Text)  # JSON string for printing specs, etc.
    
    def to_dict(self):
        return {
            'id': self.id,
            'item_type': self.item_type,
            'item_name': self.item_name,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'total_price': self.total_price,
            'specifications': self.specifications
        }


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)
    transaction_type = db.Column(db.String(20), nullable=False)  # sale, expense, refund
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)
    reference_number = db.Column(db.String(50))
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'transaction_type': self.transaction_type,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'reference_number': self.reference_number,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # rent, utilities, supplies, salary
    description = db.Column(db.Text, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(20), nullable=False)
    receipt_number = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'description': self.description,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'receipt_number': self.receipt_number,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }