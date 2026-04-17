import React, { useState } from 'react';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Profile Update:', profileData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                rows="4"
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                placeholder="Tell us about yourself..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Update Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
