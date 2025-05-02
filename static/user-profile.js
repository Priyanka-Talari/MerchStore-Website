// ✅ Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyCw76UFbmTErCFZStCby171zAsXp7b0ogw",
    authDomain: "character-c314a.firebaseapp.com",
    projectId: "character-c314a",
    storageBucket: "character-c314a.appspot.com",
    messagingSenderId: "1095213496732",
    appId: "1:1095213496732:web:62a1aac7e0a0d72a30b059",
    measurementId: "G-8V099Z96FL"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            loadUserProfile(user);
            loadUserDesigns(user.uid);
            loadUserActivity(user.uid);
        } else {
            // Redirect to login if not logged in
            window.location.href = 'login.html';
        }
    });
});

// Load user profile info
function loadUserProfile(user) {
    document.getElementById('user-email').textContent = user.email;
    
    // Get additional user data from Firestore
    db.collection('users').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('user-name').textContent = userData.name || 'User';
                
                // Format join date
                if (userData.createdAt) {
                    const joinDate = userData.createdAt.toDate();
                    document.getElementById('join-date').textContent = joinDate.toLocaleDateString();
                }
                
                // Load profile picture if available
                if (userData.profilePic) {
                    document.getElementById('user-photo').src = userData.profilePic;
                }
            }
        })
        .catch(error => {
            console.error("Error loading profile:", error);
        });
}

// Load user's saved designs
function loadUserDesigns(userId) {
    const designsContainer = document.getElementById('saved-designs');
    designsContainer.innerHTML = '<p>Loading your designs...</p>';
    
    db.collection('designs')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                designsContainer.innerHTML = '<p>You have no saved designs yet.</p>';
                return;
            }
            
            designsContainer.innerHTML = '';
            querySnapshot.forEach(doc => {
                const design = doc.data();
                const designElement = createDesignElement(doc.id, design);
                designsContainer.appendChild(designElement);
            });
        })
        .catch(error => {
            designsContainer.innerHTML = '<p>Error loading designs. Please try again.</p>';
            console.error("Error loading designs:", error);
        });
}

// Create HTML for a design item
function createDesignElement(docId, design) {
    const designElement = document.createElement('div');
    designElement.className = 'design-item';
    designElement.innerHTML = `
        <div class="design-preview">
            <img src="${design.previewImage}" alt="${design.designName}">
        </div>
        <div class="design-info">
            <h3>${design.designName}</h3>
            <p>Product: ${design.productId}</p>
            <p>Saved: ${design.createdAt.toDate().toLocaleDateString()}</p>
            <div class="design-actions">
                <button onclick="loadDesign('${docId}')" class="btn btn-small">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button onclick="deleteDesign('${docId}')" class="btn btn-small btn-outline">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    return designElement;
}

// Load user activity
function loadUserActivity(userId) {
    const activityContainer = document.getElementById('activity-feed');
    
    db.collection('activity')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get()
        .then(querySnapshot => {
            if (querySnapshot.empty) {
                activityContainer.innerHTML = '<p>No recent activity found.</p>';
                return;
            }
            
            activityContainer.innerHTML = '';
            querySnapshot.forEach(doc => {
                const activity = doc.data();
                const activityElement = document.createElement('div');
                activityElement.className = 'activity-item';
                activityElement.innerHTML = `
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                    <div>
                        <p>${activity.description}</p>
                        <small>${activity.timestamp.toDate().toLocaleString()}</small>
                    </div>
                `;
                activityContainer.appendChild(activityElement);
            });
        });
}

// Helper function for activity icons
function getActivityIcon(activityType) {
    const icons = {
        'design_save': 'fa-save',
        'design_edit': 'fa-edit',
        'purchase': 'fa-shopping-cart',
        'login': 'fa-sign-in-alt'
    };
    return icons[activityType] || 'fa-circle';
}

// Edit profile function
function editProfile() {
    // You can implement a modal or redirect to edit page
    alert("Edit profile functionality will go here");
    // window.location.href = 'edit-profile.html';
}

// Logout function
function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch(error => {
            console.error("Logout error:", error);
            alert("Error during logout. Please try again.");
        });
}

// Load a design to edit
function loadDesign(docId) {
    // Save design ID to localStorage or use a state management solution
    localStorage.setItem('editingDesignId', docId);
    window.location.href = 'customize.html?edit=' + docId;
}

// Delete a design
function deleteDesign(docId) {
    if (confirm("Are you sure you want to delete this design?")) {
        db.collection('designs').doc(docId).delete()
            .then(() => {
                // Refresh designs list
                const user = auth.currentUser;
                if (user) loadUserDesigns(user.uid);
            })
            .catch(error => {
                console.error("Error deleting design:", error);
                alert("Couldn't delete design. Please try again.");
            });
    }
}