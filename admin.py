from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import mysql.connector
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# MySQL configuration
db_config = {
    'host': 'localhost',
    'user': 'root',  # Replace with your MySQL username
    'password': 'drishu04',  # Replace with your MySQL password
    'database': 'merchstore'
}

# Function to connect to the database
def get_db_connection():
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None

# Route to display the main page (user-facing page)
@app.route('/')
def index():
    return render_template('index.html')

# Route to display the admin panel
@app.route('/admin')
def admin():
    return render_template('admin.html')

# Route to fetch all products
@app.route('/products', methods=['GET'])
def get_products():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM products')
        products = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(products)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to add a new product (for admin)
@app.route('/add_product', methods=['POST'])
def add_product():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        name = data.get('name')
        description = data.get('description')
        price = data.get('price')
        quantity = data.get('quantity')
        image_url = data.get('image_url')

        if not all([name, description, price, quantity, image_url]):
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT INTO products (name, description, price, quantity, image_url) 
            VALUES (%s, %s, %s, %s, %s)
            ''',
            (name, description, price, quantity, image_url)
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Product added successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to delete a product (for admin)
@app.route('/delete_product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        cursor.execute('DELETE FROM products WHERE id = %s', (product_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Product deleted successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to update a product (for admin)
@app.route('/update_product/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        name = data.get('name')
        description = data.get('description')
        price = data.get('price')
        quantity = data.get('quantity')
        image_url = data.get('image_url')

        if not all([name, description, price, quantity, image_url]):
            return jsonify({'error': 'Missing required fields'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        cursor.execute(
            '''
            UPDATE products 
            SET name = %s, description = %s, price = %s, quantity = %s, image_url = %s 
            WHERE id = %s
            ''',
            (name, description, price, quantity, image_url, product_id)
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Product updated successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to submit feedback
@app.route('/submit_feedback', methods=['POST'])
def submit_feedback():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        rating = data.get('rating')
        comment = data.get('comment')
        
        if not rating:
            return jsonify({'error': 'Rating is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT INTO feedback (rating, comment) 
            VALUES (%s, %s)
            ''',
            (rating, comment)
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Feedback submitted successfully!'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to fetch feedback data for admin
@app.route('/get_feedback', methods=['GET'])
def get_feedback():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating')
        result = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Format data for Chart.js
        rating_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for row in result:
            rating_counts[row['rating']] = row['count']
        
        return jsonify(rating_counts), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to fetch all feedback data (for admin)
@app.route('/get_all_feedback', methods=['GET'])
def get_all_feedback():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM feedback ORDER BY timestamp DESC')
        feedback_data = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify(feedback_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to save a customized design
@app.route('/save_design', methods=['POST'])
def save_design():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        product_id = data.get('productId')
        image_data = data.get('image')

        # Validate required fields
        if not product_id or not image_data:
            return jsonify({'error': 'productId and image are required'}), 400

        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT INTO designs (product_id, image_data)
            VALUES (%s, %s)
            ''',
            (product_id, image_data)
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({'success': True, 'message': 'Design saved successfully!'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route to fetch all saved designs
@app.route('/get_designs', methods=['GET'])
def get_designs():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute('SELECT * FROM designs ORDER BY created_at DESC')
        designs = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(designs)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)