const BACKEND_URL = 'http://127.0.0.1:5000'; // Flask server

// Fetch and display products
async function fetchProducts() {
    try {
        const response = await fetch(`${BACKEND_URL}/products`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const products = await response.json();
        const productsContainer = document.getElementById('productsContainer');
        productsContainer.innerHTML = ''; // Clear existing products

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image_url}" alt="${product.name}" />
                </div>
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Price: ₹${product.price}</p>
                <p>Quantity: ${product.quantity}</p>
                <button onclick="addToCart('${product.name}', ${product.price}, '${product.image_url}')">Buy Now</button>
            `;
            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
    }
}

// Periodically fetch products every 5 seconds
setInterval(fetchProducts, 5004);

// Initial fetch of products
fetchProducts();