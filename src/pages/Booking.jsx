import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { addDays, format } from 'date-fns';

const timeSlots = ['7-10', '10-13', '13-16', '16-19', '19-22'];

const Booking = () => {
  const [bookings, setBookings] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    const updatedBookings = { ...bookings };
    
    // Remove existing booking for the current user on the selected date
    Object.keys(updatedBookings).forEach(key => {
      if (key.startsWith(dateKey) && updatedBookings[key] === currentUser) {
        delete updatedBookings[key];
      }
    });

    // Add new booking
    updatedBookings[slotKey] = currentUser;
    
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
  };

  const isSlotBooked = (slot) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    return bookings[slotKey] !== undefined;
  };

  const isUserBooking = (slot) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const slotKey = `${dateKey}-${slot}`;
    return bookings[slotKey] === currentUser;
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Laundry Room Booking</span>
            <Button onClick={handleLogout} variant="outline">Logout</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Welcome, {currentUser}!</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date() || date > addDays(new Date(), 21)}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Bookings for {format(selectedDate, 'MMMM d, yyyy')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    onClick={() => handleBooking(slot)}
                    disabled={isSlotBooked(slot) && !isUserBooking(slot)}
                    variant={isSlotBooked(slot) ? (isUserBooking(slot) ? "default" : "secondary") : "outline"}
                    className={`h-20 ${isUserBooking(slot) ? 'bg-green-500 hover:bg-green-600' : ''}`}
                  >
                    {slot}
                    <br />
                    {isSlotBooked(slot) ? (isUserBooking(slot) ? "Your Booking" : "Booked") : "Available"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Booking;
