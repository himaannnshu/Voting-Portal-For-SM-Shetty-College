// Default candidates data structure
const defaultCandidates = {
    LR: [
        "Candidate A", "Candidate B", "Candidate C", "Candidate D", "Candidate E",
        "Candidate F", "Candidate G", "Candidate H", "Candidate I", "Candidate J"
    ],
    CR: [
        "Candidate 1", "Candidate 2", "Candidate 3", "Candidate 4", "Candidate 5",
        "Candidate 6", "Candidate 7", "Candidate 8", "Candidate 9", "Candidate 10"
    ]
};

// Load data from memory or set defaults
let candidates = JSON.parse(sessionStorage.getItem("candidates")) || defaultCandidates;
let votes = loadVotesData();
let voters = JSON.parse(sessionStorage.getItem("voters")) || [];
let currentUser = null;

// Load votes data properly - preserve existing votes when loading
function loadVotesData() {
    const savedVotes = JSON.parse(sessionStorage.getItem("votes"));
    const currentCandidates = JSON.parse(sessionStorage.getItem("candidates")) || defaultCandidates;
    
    if (savedVotes) {
        // If we have saved votes, ensure all current candidates exist in votes structure
        const votesData = {};
        for (const category in currentCandidates) {
            votesData[category] = {};
            currentCandidates[category].forEach(candidate => {
                // Preserve existing vote count or set to 0
                votesData[category][candidate] = (savedVotes[category] && savedVotes[category][candidate]) ? savedVotes[category][candidate] : 0;
            });
        }
        return votesData;
    } else {
        // Initialize fresh votes structure
        return initializeVotes();
    }
}

// Initialize votes structure based on current candidates
function initializeVotes() {
    const votesData = {};
    for (const category in candidates) {
        votesData[category] = {};
        candidates[category].forEach(candidate => {
            votesData[category][candidate] = 0;
        });
    }
    return votesData;
}

// Save data to session storage
function saveData() {
    sessionStorage.setItem("candidates", JSON.stringify(candidates));
    sessionStorage.setItem("votes", JSON.stringify(votes));
    sessionStorage.setItem("voters", JSON.stringify(voters));
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    const userTypeInput = document.querySelector('input[name="userType"]:checked');
    const userType = userTypeInput ? userTypeInput.value : "";
    
    if (userType === "admin") {
        handleAdminLogin();
    } else {
        handleVoterLogin();
    }
}

// Handle admin login
function handleAdminLogin() {
    const password = document.getElementById("adminPassword").value;
    
    if (!password) {
        document.getElementById("error-msg").textContent = "Please enter admin password";
        return;
    }
    
    if (password !== "123456") {
        document.getElementById("error-msg").textContent = "Incorrect admin password";
        return;
    }
    
    currentUser = { type: "admin", name: "Admin" };
    showMainContainer();
    showAdminPanel();
}

// Handle voter login
function handleVoterLogin() {
    const streamInput = document.querySelector('input[name="stream"]:checked');
    const stream = streamInput ? streamInput.value : "";
    const name = document.getElementById("name").value.trim();
    const classs = document.getElementById("classs").value;
    const div = document.getElementById("div").value.trim();
    
    // Validation
    if (!stream || !name || !classs || !div) {
        document.getElementById("error-msg").textContent = "Please fill all the details";
        return;
    }
    
    // Check if voter already exists
    const cleanName = name.toLowerCase();
    const existingVoter = voters.find(v => 
        v.name.toLowerCase() === cleanName && 
        v.stream === stream && 
        v.class === classs && 
        v.division.toLowerCase() === div.toLowerCase()
    );
    
    if (existingVoter) {
        document.getElementById("error-msg").textContent = "You have already voted!";
        return;
    }
    
    currentUser = {
        type: "voter",
        name: name,
        stream: stream,
        class: classs,
        division: div,
        selectedVotes: {} // Initialize selection tracking
    };
    
    document.getElementById("error-msg").textContent = "";
    showMainContainer();
    showVoterPanel();
}

// Show main container and hide login
function showMainContainer() {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("mainContainer").style.display = "block";
}

// Show voter panel
function showVoterPanel() {
    document.getElementById("voterPanel").style.display = "block";
    document.getElementById("adminPanel").style.display = "none";
    
    // Display voter info
    displayVoterInfo();
    
    // Reset any previous selections
    if (currentUser) {
        currentUser.selectedVotes = {};
    }
    
    // Populate candidates
    populateCandidates();
}

// Show admin panel
function showAdminPanel() {
    document.getElementById("voterPanel").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    
    // Load candidates for update dropdown when admin panel is shown
    loadCandidatesForUpdate();
}

// Display voter information
function displayVoterInfo() {
    const voterInfoDiv = document.getElementById("voterInfo");
    voterInfoDiv.innerHTML = `
        <strong>Voter Information:</strong><br>
        Name: ${currentUser.name} | Stream: ${currentUser.stream} | 
        Class: ${currentUser.class} | Division: ${currentUser.division}
    `;
}

// Populate candidates in the voting interface
function populateCandidates() {
    const lrContainer = document.getElementById("lrCandidates");
    const crContainer = document.getElementById("crCandidates");
    
    // Clear existing candidates
    lrContainer.innerHTML = "";
    crContainer.innerHTML = "";
    
    // Populate LR candidates
    candidates.LR.forEach(candidate => {
        const button = document.createElement("button");
        button.textContent = candidate;
        button.onclick = () => vote("LR", candidate);
        lrContainer.appendChild(button);
    });
    
    // Populate CR candidates
    candidates.CR.forEach(candidate => {
        const button = document.createElement("button");
        button.textContent = candidate;
        button.onclick = () => vote("CR", candidate);
        crContainer.appendChild(button);
    });
}

// Vote function - Modified to require voting for both categories
function vote(category, candidate) {
    if (currentUser.type !== "voter") {
        alert("Only voters can cast votes!");
        return;
    }
    
    // Check if user already voted
    const existingVote = voters.find(v => 
        v.name.toLowerCase() === currentUser.name.toLowerCase() &&
        v.stream === currentUser.stream &&
        v.class === currentUser.class &&
        v.division.toLowerCase() === currentUser.division.toLowerCase()
    );
    
    if (existingVote) {
        alert("⚠️ You have already voted!");
        return;
    }
    
    // Check if this is the first vote being cast
    if (!currentUser.selectedVotes) {
        currentUser.selectedVotes = {};
    }
    
    // Check if already selected a candidate from this category
    if (currentUser.selectedVotes[category]) {
        alert(`You have already selected ${currentUser.selectedVotes[category]} from ${category} category. Please complete your voting process.`);
        return;
    }
    
    // Record the selection
    currentUser.selectedVotes[category] = candidate;
    
    // Check if both categories have been selected
    const hasLRSelection = currentUser.selectedVotes['LR'];
    const hasCRSelection = currentUser.selectedVotes['CR'];
    
    if (hasLRSelection && hasCRSelection) {
        // Both categories selected, confirm and cast votes
        const confirmMessage = `Please confirm your votes:\n\nLR Category: ${hasLRSelection}\nCR Category: ${hasCRSelection}\n\nDo you want to submit these votes?`;
        
        if (confirm(confirmMessage)) {
            // Cast votes for both categories
            castFinalVotes();
        } else {
            // Reset selections if user cancels
            currentUser.selectedVotes = {};
            updateVotingInterface();
        }
    } else {
        // Show current selection and prompt for remaining category
        const remainingCategory = hasLRSelection ? 'CR' : 'LR';
        alert(`✅ Selected: ${candidate} from ${category} category.\n\nPlease now select one candidate from ${remainingCategory} category to complete your vote.`);
        updateVotingInterface();
    }
}

// Cast final votes for both categories
function castFinalVotes() {
    const lrCandidate = currentUser.selectedVotes['LR'];
    const crCandidate = currentUser.selectedVotes['CR'];
    
    // Ensure votes structure exists
    if (!votes['LR']) votes['LR'] = {};
    if (!votes['CR']) votes['CR'] = {};
    if (!votes['LR'][lrCandidate]) votes['LR'][lrCandidate] = 0;
    if (!votes['CR'][crCandidate]) votes['CR'][crCandidate] = 0;
    
    // Cast votes
    votes['LR'][lrCandidate]++;
    votes['CR'][crCandidate]++;
    
    // Record voter
    voters.push({
        name: currentUser.name,
        stream: currentUser.stream,
        class: currentUser.class,
        division: currentUser.division,
        lrCandidate: lrCandidate,
        crCandidate: crCandidate,
        timestamp: new Date().toLocaleString()
    });
    
    saveData();
    
    // Show success message
    const msgBox = document.getElementById("msg");
    msgBox.textContent = `✅ Votes successfully cast!\nLR Category: ${lrCandidate}\nCR Category: ${crCandidate}`;
    msgBox.style.display = "block";
    
    // Reset selections
    currentUser.selectedVotes = {};
    
    // Redirect to login after 4 seconds
    setTimeout(() => {
        logout();
    }, 4000);
}

// Update voting interface to show current selections
function updateVotingInterface() {
    const lrButtons = document.querySelectorAll('#lrCandidates button');
    const crButtons = document.querySelectorAll('#crCandidates button');
    
    // Reset all buttons
    lrButtons.forEach(btn => {
        btn.style.background = '#d9fff5';
        btn.style.color = 'black';
        btn.disabled = false;
    });
    
    crButtons.forEach(btn => {
        btn.style.background = '#d9fff5';
        btn.style.color = 'black';
        btn.disabled = false;
    });
    
    // Highlight selected candidates
    if (currentUser.selectedVotes) {
        if (currentUser.selectedVotes['LR']) {
            lrButtons.forEach(btn => {
                if (btn.textContent === currentUser.selectedVotes['LR']) {
                    btn.style.background = '#6b8f71';
                    btn.style.color = 'white';
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                }
            });
        }
        
        if (currentUser.selectedVotes['CR']) {
            crButtons.forEach(btn => {
                if (btn.textContent === currentUser.selectedVotes['CR']) {
                    btn.style.background = '#6b8f71';
                    btn.style.color = 'white';
                } else {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                }
            });
        }
    }
}

// Add new candidate (Admin only)
function addCandidate() {
    const category = document.getElementById("categorySelect").value;
    const candidateName = document.getElementById("candidateName").value.trim();
    
    if (!candidateName) {
        alert("Please enter a candidate name");
        return;
    }
    
    if (candidates[category].includes(candidateName)) {
        alert("Candidate already exists in this category");
        return;
    }
    
    candidates[category].push(candidateName);
    
    // Ensure votes structure exists for this candidate
    if (!votes[category]) {
        votes[category] = {};
    }
    votes[category][candidateName] = 0;
    
    saveData();
    
    document.getElementById("candidateName").value = "";
    loadCandidatesForUpdate(); // Refresh the update dropdown
    alert(`Candidate "${candidateName}" added to ${category} category`);
}

// Remove candidate (Admin only)
function removeCandidate() {
    const category = document.getElementById("categorySelect").value;
    const candidateName = document.getElementById("candidateName").value.trim();
    
    if (!candidateName) {
        alert("Please enter a candidate name to remove");
        return;
    }
    
    const candidateIndex = candidates[category].indexOf(candidateName);
    if (candidateIndex === -1) {
        alert("Candidate not found in this category");
        return;
    }
    
    if (confirm(`Are you sure you want to remove "${candidateName}" from ${category} category?`)) {
        candidates[category].splice(candidateIndex, 1);
        delete votes[category][candidateName];
        
        // Remove votes for this candidate
        voters = voters.filter(v => !(v.category === category && v.candidate === candidateName));
        
        saveData();
        document.getElementById("candidateName").value = "";
        loadCandidatesForUpdate(); // Refresh the update dropdown
        alert(`Candidate "${candidateName}" removed from ${category} category`);
    }
}

// Load candidates for update dropdown
function loadCandidatesForUpdate() {
    const category = document.getElementById("categorySelect").value;
    const selectElement = document.getElementById("existingCandidateSelect");
    
    // Clear existing options
    selectElement.innerHTML = '<option value="">Select candidate to update</option>';
    
    // Add current candidates as options
    candidates[category].forEach(candidate => {
        const option = document.createElement("option");
        option.value = candidate;
        option.textContent = candidate;
        selectElement.appendChild(option);
    });
}

// Update existing candidate name
function updateCandidate() {
    const category = document.getElementById("categorySelect").value;
    const oldName = document.getElementById("existingCandidateSelect").value;
    const newName = document.getElementById("newCandidateName").value.trim();
    
    if (!oldName) {
        alert("Please select a candidate to update");
        return;
    }
    
    if (!newName) {
        alert("Please enter the new candidate name");
        return;
    }
    
    if (oldName === newName) {
        alert("New name is the same as the current name");
        return;
    }
    
    if (candidates[category].includes(newName)) {
        alert("A candidate with this name already exists in this category");
        return;
    }
    
    if (confirm(`Are you sure you want to update "${oldName}" to "${newName}"?`)) {
        // Update candidate name in candidates array
        const candidateIndex = candidates[category].indexOf(oldName);
        candidates[category][candidateIndex] = newName;
        
        // Update votes data safely
        if (!votes[category]) {
            votes[category] = {};
        }
        const oldVoteCount = votes[category][oldName] || 0;
        votes[category][newName] = oldVoteCount;
        delete votes[category][oldName];
        
        // Update voter records
        voters.forEach(voter => {
            if (voter.category === category && voter.candidate === oldName) {
                voter.candidate = newName;
            }
        });
        
        saveData();
        
        // Clear inputs and refresh dropdown
        document.getElementById("newCandidateName").value = "";
        document.getElementById("existingCandidateSelect").value = "";
        loadCandidatesForUpdate();
        
        alert(`Candidate "${oldName}" has been updated to "${newName}"`);
    }
}

// Show total votes
function showTotalVotes() {
    let total = 0;
    
    // Calculate total votes safely
    for (const category in votes) {
        if (votes[category]) {
            for (const candidate in votes[category]) {
                total += votes[category][candidate] || 0;
            }
        }
    }
    
    const html = `
        <div style="
            background-color: #B9F5D8;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            text-align: center;
            font-size: 24px;
            font-weight: 600;
            color: #1D1E18;
        ">
            🧮 <span style="color: #6B8F71;">Total Votes:</span> ${total}
        </div>
    `;
    
    document.getElementById("results").innerHTML = html;
}

// Show votes by category
function showVotesByCategory() {
    let html = `
        <h3 style="text-align:center; margin-bottom: 20px;">📊 Votes by Category</h3>
        <div style="overflow-x:auto;">
            <table>
                <thead>
                    <tr>
                        <th>Candidate</th>
                        <th>Votes</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    for (const cat in votes) {
        html += `
            <tr style="background-color: #AAD2BA;">
                <td colspan="2" style="font-weight: bold; text-align: center;">
                    ${cat} Category
                </td>
            </tr>
        `;
        
        // Ensure we have votes data for this category
        if (votes[cat]) {
            for (const cand in votes[cat]) {
                const voteCount = votes[cat][cand] || 0;
                html += `
                    <tr>
                        <td>${cand}</td>
                        <td>${voteCount}</td>
                    </tr>
                `;
            }
        }
    }
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById("results").innerHTML = html;
}

// Show all voters - Updated to show both LR and CR votes
function showAllVoters() {
    if (voters.length === 0) {
        document.getElementById("results").innerHTML = "<p>No one has voted yet.</p>";
        return;
    }
    
    let html = `
        <h3 style="text-align:center; margin-bottom: 20px;">🗳️ Voter Details</h3>
        <div style="overflow-x:auto;">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Stream</th>
                        <th>Class</th>
                        <th>Division</th>
                        <th>LR Candidate</th>
                        <th>CR Candidate</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    voters.forEach(voter => {
        html += `
            <tr>
                <td>${voter.name}</td>
                <td>${voter.stream}</td>
                <td>${voter.class}</td>
                <td>${voter.division}</td>
                <td>${voter.lrCandidate || 'N/A'}</td>
                <td>${voter.crCandidate || 'N/A'}</td>
                <td>${voter.timestamp}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById("results").innerHTML = html;
}

// Clear all data
function clearAllData() {
    if (confirm("Are you sure you want to clear all voting data? This action cannot be undone.")) {
        candidates = JSON.parse(JSON.stringify(defaultCandidates));
        votes = initializeVotes();
        voters = [];
        saveData();
        document.getElementById("results").innerHTML = "";
        alert("All data has been cleared successfully!");
    }
}

// Logout function
function logout() {
    currentUser = null;
    document.getElementById("loginSection").style.display = "flex";
    document.getElementById("mainContainer").style.display = "none";
    
    // Reset login form
    document.getElementById("name").value = "";
    document.getElementById("classs").value = "";
    document.getElementById("div").value = "";
    document.getElementById("adminPassword").value = "";
    document.getElementById("error-msg").textContent = "";
    
    // Reset radio buttons
    document.getElementById("voter").checked = true;
    document.querySelector('input[name="stream"]:checked') && 
        (document.querySelector('input[name="stream"]:checked').checked = false);
    
    // Hide/show appropriate fields
    toggleUserFields();
    
    // Hide success message
    document.getElementById("msg").style.display = "none";
}

// Toggle between voter and admin fields
function toggleUserFields() {
    const userType = document.querySelector('input[name="userType"]:checked').value;
    const voterFields = document.getElementById("voterFields");
    const adminFields = document.getElementById("adminFields");
    
    if (userType === "admin") {
        voterFields.style.display = "none";
        adminFields.style.display = "block";
    } else {
        voterFields.style.display = "block";
        adminFields.style.display = "none";
    }
}

// Event listeners
document.addEventListener("DOMContentLoaded", function() {
    // Add event listeners for user type radio buttons
    document.querySelectorAll('input[name="userType"]').forEach(radio => {
        radio.addEventListener('change', toggleUserFields);
    });
    
    // Initialize with voter fields visible
    toggleUserFields();
    
    // Ensure votes data is properly loaded and structured
    votes = loadVotesData();
    saveData();
    
    console.log("Loaded votes data:", votes); // Debug log
    console.log("Loaded voters data:", voters); // Debug log
});