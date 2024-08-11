import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const timeSlots = ['7-10', '10-13', '13-16', '16-19', '19-22'];

const Booking = () => {
  const [bookings, setBookings] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/');
    } else {
      setCurrentUser(user);
      const storedBookings = JSON.parse(localStorage.getItem('bookings')) || {};
      setBookings(storedBookings);
    }
  }, [navigate]);

  const handleBooking = (slot) => {
    const updatedBookings = { ...bookings };
    
    // Remove existing booking for the current user
    Object.keys(updatedBookings).forEach(key => {
      if (updatedBookings[key] === currentUser) {
        delete updatedBookings[key];
      }
    });

    // Add new booking
    updatedBookings[slot] = currentUser;
    
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Laundry Room Booking</span>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Welcome, {currentUser}!</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {timeSlots.map((slot) => (
              <Button
                key={slot}
                onClick={() => handleBooking(slot)}
                disabled={bookings[slot] === currentUser}
                variant={bookings[slot] ? (bookings[slot] === currentUser ? "default" : "secondary") : "outline"}
                className="h-20"
              >
                {slot}
                <br />
                {bookings[slot] ? (bookings[slot] === currentUser ? "Your Booking" : "Booked") : "Available"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Booking;
