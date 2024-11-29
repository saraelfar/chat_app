import React, { useState, useEffect } from "react";
import { Chat, Channel, MessageInput, MessageList, ChannelHeader } from "stream-chat-react";
import { StreamChat } from "stream-chat";
import "stream-chat-react/dist/css/v2/index.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import Auth from "./Auth";
import "./App.css";
import { getStorage } from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNcnY_vZjQiqKmhlCUmThLZy8TJekGwso",
  authDomain: "chatapp-e65d0.firebaseapp.com",
  projectId: "chatapp-e65d0",
  storageBucket: "chatapp-e65d0.appspot.com",
  messagingSenderId: "1019623687939",
  appId: "1:1019623687939:web:f05f0bc8730e3924d94b36",
  measurementId: "G-Q660PMWEM8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const App = () => {
  const [user, setUser] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newProfilePic, setNewProfilePic] = useState(null);

  const handleUserLogin = async (currentUser) => {
    const client = StreamChat.getInstance("s3zucjsfh58g");

    try {
      const token = client.devToken(currentUser.uid);
      await client.connectUser(
        {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email, // Use displayName or email if displayName is unavailable
        },
        token
      );

      // Fetch contacts (all users in the chat system)
      const response = await client.queryUsers({ id: { $ne: currentUser.uid } });
      setContacts(response.users);

      // Set chat client
      setChatClient(client);
      setUser(currentUser);  // Ensure user is set here with necessary data
    } catch (error) {
      console.error("Error connecting to Stream Chat:", error);
    }
  };

  const handleChannelSelection = async (contactId) => {
    if (chatClient) {
      const newChannel = chatClient.channel("messaging", {
        members: [user.uid, contactId],
      });
      await newChannel.watch();
      setChannel(newChannel);
    }
  };

  const handleProfileUpdate = async () => {
    if (chatClient && newName.trim()) {
      try {
        let updatedProfilePicUrl = null;
  
        if (newProfilePic) {
          // Upload the profile picture to a storage service (e.g., Firebase Storage)
          const storageRef = getStorage().ref(`profile-pictures/${user.uid}/${newProfilePic.name}`);
          await storageRef.put(newProfilePic);
          updatedProfilePicUrl = await storageRef.getDownloadURL();
        }
  
        const updatedUser = {
          id: user.uid, // Required for Stream API
          name: newName.trim(),
        };
  
        if (updatedProfilePicUrl) {
          updatedUser.image = updatedProfilePicUrl;
        }
  
        // Update user profile in Stream Chat
        await chatClient.updateUser(updatedUser);
  
        // Update local state with new profile data
        setUser((prevUser) => ({
          ...prevUser,
          name: updatedUser.name,
          ...(updatedProfilePicUrl && { profilePic: updatedProfilePicUrl }),
        }));
  
        alert("Profile updated successfully!");
        setShowModal(false); // Close the modal
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Error updating profile. Please try again.");
      }
    } else {
      alert("Please enter a valid name.");
    }
  };
console.log("Updating profile with:", { newName, newProfilePic });
  

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      chatClient.disconnectUser();
      setUser(null);
      setChatClient(null);
      setChannel(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        handleUserLogin(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return <Auth onLogin={(currentUser) => setUser(currentUser)} />;
  }

  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
{/* Contacts Section (Left 30%) */}
<div
  className="d-flex flex-column bg-light border-end"
  style={{
    width: "30%",
    backgroundColor: '#f8f9fa',
    maxWidth: '30%',
    flexShrink: 0,
    height: '100vh',
    overflowY: 'auto',
  }}
>
  <h3 className="p-3 text-center border-bottom">Contacts</h3>
  <ul className="list-group list-group-flush overflow-auto flex-grow-1">
    {contacts.map((contact) => (
      <li
        key={contact.id}
        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
        style={{ cursor: "pointer", padding: '15px' }}
        onClick={() => handleChannelSelection(contact.id)}
      >
        <div className="d-flex align-items-center">
          {/* User Avatar or Initial */}
          <div className="rounded-circle" style={{ width: '40px', height: '40px', backgroundColor: '#6c63ff', color: '#fff', textAlign: 'center', lineHeight: '40px' }}>
            {contact.name ? contact.name.charAt(0).toUpperCase() : 'U'}
          </div>
          {/* Contact Name */}
          <span className="ms-3">{contact.name || "Unknown"}</span>
        </div>
        {/* Online Status Indicator */}
        <div className="d-flex align-items-center">
          <span
            className="ms-3 rounded-circle"
            style={{
              width: '10px',
              height: '10px',
              backgroundColor: contact.online ? 'green' : 'red',
              display: 'inline-block',
            }}
          ></span>
          <i className="bi bi-chat-dots ms-2"></i>
        </div>
      </li>
    ))}
  </ul>
</div>


      {/* Chat Section (Right 70%) */}
      <div className="flex-grow-1 bg-light" style={{ height: '100vh', overflow: 'hidden' }}>
        {channel && chatClient ? (
          <Chat client={chatClient} theme="team light">
            <Channel channel={channel}>
              <div className="card shadow-sm h-100">
                <div className="card-header d-flex align-items-center">
                  {/* Welcome Message */}
                  <h5 className="m-0">
                    Welcome, {user ? user.displayName || user.email : "Loading..."}
                  </h5>
                  {/* Profile Settings Button */}
                  <button
                    className="btn btn-light ms-auto"
                    onClick={() => setShowModal(true)}
                  >
                    <i className="bi bi-gear"></i> Settings
                  </button>
                  {/* Logout Button */}
                  <button
                    className="btn btn-danger ms-2"
                    onClick={handleLogout}
                  >
                    <i className="bi bi-box-arrow-right"></i> Logout
                  </button>
                </div>
                <div className="card-body p-0" style={{ overflowY: "scroll", height: "calc(100vh - 60px)" }}>
                  <MessageList />
                </div>
                <div className="card-footer">
                  <MessageInput />
                </div>
              </div>
            </Channel>
          </Chat>
        ) : (
          <div className="text-center p-5">
            <h5>Select a contact to start a conversation</h5>
          </div>
        )}
      </div>

      {/* Profile Settings Modal */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          tabIndex="-1"
          aria-labelledby="profileModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="profileModalLabel">Update Profile</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="newName" className="form-label">New Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="newName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={user.name}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newProfilePic" className="form-label">Profile Picture</label>
                  <input
                    type="file"
                    className="form-control"
                    id="newProfilePic"
                    onChange={(e) => setNewProfilePic(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleProfileUpdate}
                >
                  Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
