from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import google.generativeai as genai
import mysql.connector

# 🔹 Replace with actual API keys
API_KEYS = {
    "peter_parker": "AIzaSyAKQPPc72g5twT_5epaR18HRFUIMhHvcbs",
    "jasmine": "AIzaSyA35TqKrx8viE60-L-0U3luybPByo8iDaw",
    "doraemon": "AIzaSyBgWi8bX7sY1qkavms5E1vLwBjuvkU_0-8"
}

# MySQL Database Configuration
MYSQL_CONFIG = {
    "host": "localhost",  # Replace with your MySQL host
    "user": "root",       # Replace with your MySQL username
    "password": "drishu04",  # Replace with your MySQL password
    "database": "merchstore"  # Replace with your database name
}

def create_app(character_name, port):
    app = Flask(__name__)
    CORS(app)
    genai.configure(api_key=API_KEYS[character_name])

    def get_product_recommendations(character_name):
        try:
            # Connect to MySQL database
            conn = mysql.connector.connect(**MYSQL_CONFIG)
            cursor = conn.cursor(dictionary=True)

            # Debug: Print connection success
            print("✅ Connected to MySQL database!")

            # Define character-specific filters
            filters = {
                "peter_parker": "name LIKE '%Spider-Man%' OR name LIKE '%Spiderman%' OR description LIKE '%Spider-Man%' OR description LIKE '%Spiderman%'",
                "jasmine": "name LIKE '%Jasmine%' OR description LIKE '%Jasmine%'",
                "doraemon": "name LIKE '%Doraemon%' OR description LIKE '%Doraemon%'"
            }

            # Fetch products for the specific character
            print(f"🔍 Fetching products for {character_name}")
            query = f"SELECT name, description, price FROM products WHERE {filters[character_name]}"
            cursor.execute(query)
            products = cursor.fetchall()

            # Debug: Print fetched products
            print("📦 Fetched products:", products)

            # Close the connection
            cursor.close()
            conn.close()

            return products
        except mysql.connector.Error as err:
            print("❌ MySQL Error:", err)
            return []

    @app.route("/chat", methods=["POST"])
    def chat():
        try:
            data = request.json
            user_input = data.get("message", "").strip()

            if not user_input:
                return jsonify({"response": "Please provide a message."})

            system_prompts = {
                "peter_parker": """
                You are Peter Parker, also known as Spider-Man! You're a witty, intelligent, and friendly superhero.
                You talk directly to the user, cracking jokes, being a little sarcastic, and always staying upbeat.
                Keep responses short, fun, and full of personality (2-3 sentences max).
                Stay fully in character as Peter Parker / Spider-Man at all times.
                If the user asks about gadgets or products, naturally recommend some cool items from your database.
                """,
                "jasmine": """
                You are Princess Jasmine from Agrabah, a warm, adventurous, and friendly princess.
                You respond in a casual, fun, and friendly way—like talking to a friend.
                Keep responses short & engaging (2-3 sentences max).
                Avoid long stories or unnecessary details.
                If the user asks about magical items or products, naturally recommend some items from your database.
                """,
                "doraemon": """
                You are Doraemon, the friendly and intelligent robotic cat from the 22nd century!
                You know everything about your world, including Nobita, Shizuka, Gian, Suneo, and your futuristic gadgets.
                Keep responses short (2-3 sentences) and fun, like talking to a curious friend.
                Stay fully in character as Doraemon.
                If the user asks about gadgets or futuristic items, naturally recommend some items from your database.
                """
            }

            system_prompt = system_prompts[character_name]
            model = genai.GenerativeModel("gemini-1.5-pro")
            response = model.generate_content(f"{system_prompt}\nUser: {user_input}\n{character_name.capitalize()}: ")
            reply = response.text.strip()

            # Debug: Print chatbot's initial reply
            print("🤖 Chatbot's initial reply:", reply)

            # Check if the user's input or chatbot's response suggests recommending products
            recommend_products = False

            # Keywords that might trigger product recommendations
            trigger_keywords = {
                "peter_parker": ["gadget", "web shooter", "tech", "product", "spider-man", "spiderman"],
                "jasmine": ["magic", "carpet", "lamp", "product", "jasmine"],
                "doraemon": ["gadget", "future", "tool", "product", "doraemon"]
            }

            # Check if the user's input contains trigger keywords
            for keyword in trigger_keywords[character_name]:
                if keyword in user_input.lower():
                    recommend_products = True
                    break

            # If the chatbot's response suggests recommending products
            if "recommend" in reply.lower() or "product" in reply.lower():
                recommend_products = True

            # Debug: Print whether products will be recommended
            print(f"🛒 Recommend products? {recommend_products}")

            # Fetch and include product recommendations if relevant
            if recommend_products:
                print("🛒 Fetching product recommendations...")
                products = get_product_recommendations(character_name)
                if products:
                    product_list = "\n".join([f"- {product['name']}: {product['description']} (Rs {product['price']})" for product in products])
                    reply = f"{reply}\n\nYou know what? I think you'd love these:\n{product_list}"
                else:
                    reply = f"{reply}\n\nHmm, I don't have any recommendations right now, but I'll keep an eye out for you!"

            # Debug: Print final reply
            print("📝 Final reply:", reply)

            return jsonify({"response": reply})

        except Exception as e:
            print("❌ Error:", str(e))
            return jsonify({"response": "Oh no! Something went wrong.", "error": str(e)}), 500

    def run():
        app.run(port=port, debug=False)  # 🔹 Set debug=False to avoid threading issues

    return threading.Thread(target=run, daemon=True)  # 🔹 Set daemon=True to allow clean exit

# 🔹 Run all chatbots concurrently
threads = [
    create_app("peter_parker", 5002),
    create_app("jasmine", 5003),
    create_app("doraemon", 5001)
]

for thread in threads:
    thread.start()

# 🔹 Keep the main thread alive to prevent script from exiting
for thread in threads:
    thread.join()