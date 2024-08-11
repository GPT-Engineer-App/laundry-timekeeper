import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { addDays, format, parseISO, isToday, isBefore, startOfDay, isAfter, isValid, isSameDay, addHours } from 'date-fns';

const timeSlots = ['7-8', '8-10', '10-11', '11-13', '13-14', '14-16', '16-17', '17-19', '19-20', '20-22'];

const Booking = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [quickRinse, setQuickRinse] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      navigate('/');
    } else {
      setCurrentUser(user);
      const allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
      const userBookings = allBookings.filter(booking => booking.user === user && !booking.isQuickRinse);
      const userQuickRinse = allBookings.find(booking => booking.user === user && booking.isQuickRinse);
      setUpcomingBookings(userBookings);
      setQuickRinse(userQuickRinse);
    }
  }, [navigate]);

  const handleDateSelect = (date) => {
    if (date && !isSameDay(date, selectedDate)) {
      setSelectedDate(date);
    }
  };

  const handleBooking = (slot, isQuickRinse = false) => {
    const [startHour, endHour] = slot.split('-');
    const bookingDate = new Date(selectedDate);
    bookingDate.setHours(parseInt(startHour, 10), 0, 0, 0);

    const newBooking = {
      user: currentUser,
      date: bookingDate.toISOString(),
      timeSlot: isQuickRinse ? `${startHour}-${parseInt(startHour) + 1}` : slot,
      isQuickRinse: isQuickRinse
    };

    // Get all bookings
    let allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    
    if (isQuickRinse) {
      // Remove any existing quick rinse for the current user
      allBookings = allBookings.filter(booking => !(booking.user === currentUser && booking.isQuickRinse));
      allBookings.push(newBooking);
      setQuickRinse(newBooking);
    } else {
      // Add the new regular booking
      allBookings.push(newBooking);
      setUpcomingBookings(prevBookings => [...prevBookings, newBooking]);
    }
    
    // Update all bookings in localStorage
    localStorage.setItem('allBookings', JSON.stringify(allBookings));
  };

  const cancelBooking = (bookingToCancel) => {
    // Remove the booking from allBookings
    let allBookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    allBookings = allBookings.filter(booking => 
      !(booking.user === currentUser && 
        booking.date === bookingToCancel.date && 
        booking.timeSlot === bookingToCancel.timeSlot)
    );
    localStorage.setItem('allBookings', JSON.stringify(allBookings));

    if (bookingToCancel.isQuickRinse) {
      setQuickRinse(null);
    } else {
      setUpcomingBookings(prevBookings => 
        prevBookings.filter(booking => 
          !(booking.date === bookingToCancel.date && booking.timeSlot === bookingToCancel.timeSlot)
        )
      );
    }
  };

  const isSlotBooked = (slot) => {
    const bookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    const [startHour, endHour] = slot.split('-');
    return bookings.some(booking => {
      const bookingDate = new Date(booking.date);
      const [bookingStartHour, bookingEndHour] = booking.timeSlot.split('-');
      return format(bookingDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
        (parseInt(bookingStartHour) < parseInt(endHour) && parseInt(bookingEndHour) > parseInt(startHour));
    });
  };

  const isUserBooking = (slot) => {
    const bookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    return bookings.some(booking => 
      format(parseISO(booking.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
      booking.timeSlot === slot &&
      booking.user === currentUser
    );
  };

  const isSlotAvailable = (slot) => {
    const bookings = JSON.parse(localStorage.getItem('allBookings')) || [];
    const [startHour, endHour] = slot.split('-');
    return !bookings.some(booking => {
      const bookingDate = new Date(booking.date);
      return format(bookingDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
        ((!booking.isQuickRinse && booking.timeSlot === slot) ||
         (booking.isQuickRinse && bookingDate.getHours() >= parseInt(startHour) && bookingDate.getHours() < parseInt(endHour))) &&
        booking.user !== currentUser;
    });
  };

  const isSlotPast = (slot) => {
    const [startHour] = slot.split('-');
    const slotDate = new Date(selectedDate);
    slotDate.setHours(parseInt(startHour, 10), 0, 0, 0);
    return isBefore(slotDate, new Date());
  };

  const formatDate = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error('Invalid date:', date);
      return 'Invalid Date';
    }
    return format(date, 'MMMM d, yyyy');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {upcomingBookings.length > 0 && (
        <div className="max-w-4xl mx-auto mb-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Your Upcoming Bookings:</h3>
          {upcomingBookings.map((booking, index) => (
            <div key={index} className="flex justify-between items-center mb-2">
              <p className="text-lg font-medium">
                {format(parseISO(booking.date), 'MMMM d, yyyy')} - {booking.timeSlot}
              </p>
              <Button onClick={() => cancelBooking(booking)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          ))}
        </div>
      )}
      {quickRinse && (
        <div className="max-w-4xl mx-auto mb-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-2">Your Quick Rinse:</h3>
          <div className="flex justify-between items-center">
            <p className="text-lg font-medium">
              {format(parseISO(quickRinse.date), 'MMMM d, yyyy')} - {quickRinse.timeSlot}
            </p>
            <Button onClick={() => cancelBooking(quickRinse)} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
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
                onSelect={handleDateSelect}
                className="rounded-md border"
                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || date > addDays(new Date(), 21)}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Bookings for {formatDate(selectedDate)}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {timeSlots.map((slot) => {
                  const isPast = isSlotPast(slot);
                  const isBooked = isSlotBooked(slot);
                  const isUserSlot = isUserBooking(slot);
                  const isAvailable = isSlotAvailable(slot);
                  const canBook = !isPast && (isAvailable || isUserSlot);
                  const [startHour, endHour] = slot.split('-');
                  const isQuickRinseSlot = parseInt(endHour) - parseInt(startHour) === 1;

                  return (
                    <AlertDialog key={slot}>
                      {isUserSlot ? (
                        <>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="default"
                              className="h-20 bg-green-500 hover:bg-green-600"
                            >
                              {slot}
                              <br />
                              Your Booking
                              {isQuickRinseSlot && <br />}
                              {isQuickRinseSlot && "(Quick Rinse)"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel your booking for {slot} on {formatDate(selectedDate)}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No</AlertDialogCancel>
                              <AlertDialogAction onClick={() => cancelBooking(isQuickRinseSlot)}>Yes, Cancel Booking</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </>
                      ) : (
                        <>
                          <AlertDialogTrigger asChild>
                            <Button
                              disabled={!canBook || isBooked}
                              variant="outline"
                              className={`h-20 ${isPast ? 'opacity-50' : ''}`}
                            >
                              {slot}
                              <br />
                              {isPast ? "Past" : (isBooked ? "Unavailable" : "Available")}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Book Slot</AlertDialogTitle>
                              <AlertDialogDescription>
                                Choose booking type for {slot} on {formatDate(selectedDate)}:
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              {!isQuickRinseSlot && (
                                <AlertDialogAction onClick={() => handleBooking(slot, false)}>Full Booking</AlertDialogAction>
                              )}
                              <AlertDialogAction onClick={() => handleBooking(slot, true)}>Quick Rinse</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </>
                      )}
                    </AlertDialog>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Booking;
