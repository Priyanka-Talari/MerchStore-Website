document.addEventListener("DOMContentLoaded", function () {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    updateCartCount();

    function updateCartCount() {
        const cartLink = document.querySelector(".navbar-links li:nth-child(3) a");
        if (cartLink) {
            cartLink.textContent = `🛒 Cart (${cart.length})`;
        }
    }

    window.addToCart = function (productName, price, imageUrl) {
        let cartItem = {
            name: productName,
            price: price,
            image: imageUrl,
            quantity: 1
        };

        let existingItem = cart.find(item => item.name === productName);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push(cartItem);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartCount();
        alert(`${productName} added to cart!`);
    };

    document.addEventListener("DOMContentLoaded", function () {
        const user = JSON.parse(localStorage.getItem("user"));
    
        if (user) {
            document.getElementById("nav-username").textContent = user.username;
            document.getElementById("nav-profile-pic").src = user.profile_picture || "default-profile.png";
        }
    });
    
    function logout() {
        localStorage.removeItem("user");
        window.location.href = "register.html"; // Redirect to login page
    }
});
