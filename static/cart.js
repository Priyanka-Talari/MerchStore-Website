document.addEventListener("DOMContentLoaded", function () {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let cartContainer = document.getElementById("cart-items");
    let totalPriceElement = document.getElementById("total-price");
    let clearCartBtn = document.getElementById("clear-cart");

    // Payment method toggle
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const cardForm = document.getElementById('card-payment-form');
            cardForm.style.display = this.value === 'card' ? 'block' : 'none';
            
            const checkoutBtn = document.getElementById('checkout-btn');
            checkoutBtn.textContent = this.value === 'card' ? 'Pay Now' : 'Place Order (COD)';
        });
    });

    function updateCartDisplay() {
        cartContainer.innerHTML = "";
        let totalPrice = 0;

        if (cart.length === 0) {
            cartContainer.innerHTML = "<p>Your cart is empty.</p>";
            totalPriceElement.innerText = "0.00";
        } else {
            cart.forEach((item, index) => {
                totalPrice += parseFloat(item.price);

                let productDiv = document.createElement("div");
                productDiv.classList.add("cart-item");
                productDiv.innerHTML = `
                    <img src="${item.image}" alt="${item.name}" width="50">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>₹${item.price.toFixed(2)}</p>
                    </div>
                    <button onclick="removeFromCart(${index})">Remove</button>
                `;
                cartContainer.appendChild(productDiv);
            });

            totalPriceElement.innerText = totalPrice.toFixed(2);
        }
    }

    // Format card number input
    document.getElementById('cardNumber')?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        value = value.replace(/(\d{4})/g, '$1 ').trim();
        e.target.value = value;
    });

    // Format expiry date input
    document.getElementById('expiry')?.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.slice(0,2) + '/' + value.slice(2);
        }
        e.target.value = value;
    });

    function removeFromCart(index) {
        cart.splice(index, 1);
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartDisplay();
    }

    function validateCardDetails() {
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiry = document.getElementById('expiry').value;
        const cvv = document.getElementById('cvv').value;

        if (!cardNumber || !expiry || !cvv) {
            alert("Please fill in all card details");
            return false;
        }

        if (!/^\d{16}$/.test(cardNumber)) {
            alert("Invalid card number! Must be 16 digits.");
            return false;
        }

        if (!/^\d{2}\/\d{2}$/.test(expiry)) {
            alert("Invalid expiry format! Use MM/YY.");
            return false;
        }

        if (!/^\d{3,4}$/.test(cvv)) {
            alert("Invalid CVV! Must be 3 or 4 digits.");
            return false;
        }

        return true;
    }

    async function processPayment() {
        if (cart.length === 0) {
            alert("Your cart is empty. Add items before proceeding to checkout!");
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        if (paymentMethod === 'cod') {
            alert("Order placed successfully! Payment will be collected on delivery.");
            clearCart();
            window.location.href = '/templates/index.html';
            return;
        }

        // Validate card details before proceeding
        if (!validateCardDetails()) return;

        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expiry = document.getElementById('expiry').value;
        const cvv = document.getElementById('cvv').value;

        try {
            const response = await fetch('/process-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    cardNumber,
                    expiry,
                    cvv,
                    amount: parseFloat(totalPriceElement.textContent)
                })
            });

            const result = await response.json();
            
            if (response.ok) {
                alert('Payment successful! Order placed.');
                clearCart();
                window.location.href = '/templates/index.html';
            } else {
                alert(result.message || 'Payment failed. Please try again.');
            }
        } catch (error) {
            alert('An error occurred while processing payment. Please try again.');
        }
    }

    function clearCart() {
        localStorage.removeItem("cart");
        cart = [];
        updateCartDisplay();
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener("click", clearCart);
    }

    updateCartDisplay();

    // Make functions available globally
    window.removeFromCart = removeFromCart;
    window.processPayment = processPayment;
    window.validateCardDetails = validateCardDetails;
});
