const BACKEND_URL = 'http://127.0.0.1:5000'; // Flask server

// Fetch and display products
async function fetchProducts() {
    try {
        const response = await fetch(`${BACKEND_URL}/products`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const products = await response.json();
        console.log(products); // Check the console for the fetched data
        const productsContainer = document.getElementById('productsContainer');
        productsContainer.innerHTML = ''; // Clear existing products

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" />
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p>Price: ₹${product.price}</p>
                <p>Quantity: ${product.quantity}</p>
                <button onclick="deleteProduct(${product.id})">Delete</button>
            `;
            productsContainer.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        const productsContainer = document.getElementById('productsContainer');
        productsContainer.innerHTML = '<p class="error-message">Failed to load products. Please check if the server is running.</p>';
    }
}

// Add product
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const product = {
        name: document.getElementById('name').value,
        description: document.getElementById('description').value,
        price: parseFloat(document.getElementById('price').value),
        quantity: parseInt(document.getElementById('quantity').value),
        image_url: document.getElementById('image_url').value
    };

    try {
        const response = await fetch(`${BACKEND_URL}/add_product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(product)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        alert(result.message);
        fetchProducts(); // Refresh the product list
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product. Please check if the server is running.');
    }
});

// Delete product
async function deleteProduct(productId) {
    try {
        const response = await fetch(`${BACKEND_URL}/delete_product/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const result = await response.json();
        alert(result.message);
        fetchProducts(); // Refresh the product list
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please check if the server is running.');
    }
}

// Fetch feedback data and render pie chart
async function fetchFeedback() {
    try {
        const response = await fetch(`${BACKEND_URL}/get_feedback`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const feedbackData = await response.json();
        console.log("Feedback Data:", feedbackData);

        // Prepare data for the pie chart
        const pieChartData = {
            labels: ["1 Star", "2 Stars", "3 Stars", "4 Stars", "5 Stars"],
            datasets: [{
                data: [feedbackData[1], feedbackData[2], feedbackData[3], feedbackData[4], feedbackData[5]],
                backgroundColor: [
                    "#FF6384", // Red
                    "#36A2EB", // Blue
                    "#FFCE56", // Yellow
                    "#4BC0C0", // Teal
                    "#9966FF"  // Purple
                ]
            }]
        };

        // Render the pie chart
        renderPieChart(pieChartData);
    } catch (error) {
        console.error('Error fetching feedback data:', error);
    }
}

// Render pie chart
function renderPieChart(data) {
    const ctx = document.getElementById('feedbackPieChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Customer Feedback Ratings'
                }
            }
        }
    });
}

// Initial fetch of products and feedback data
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    fetchFeedback();
});