
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Menu as MenuIcon, X, ShoppingCart, User as UserIcon, LogOut, 
  MapPin, Phone, MessageCircle, ChevronRight, Plus, Minus, Trash2, 
  CheckCircle2, Clock, History, Gift, Info, Settings, LayoutDashboard,
  ShieldCheck, ArrowLeft, Copy, Eye, ExternalLink, QrCode, Search
} from 'lucide-react';
import { 
  User, Hotel, MenuItem, CartItem, Order, Coupon, Banner, AppSettings, View 
} from './types';
import { 
  INITIAL_SETTINGS, INITIAL_HOTELS, INITIAL_MENU, INITIAL_COUPONS, INITIAL_BANNERS 
} from './constants';

// --- Local Storage Helpers ---
const storage = {
  get: <T,>(key: string, defaultValue: T): T => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  },
  set: (key: string, value: any) => {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const App: React.FC = () => {
  // --- Global State ---
  const [view, setView] = useState<View>('LOGIN');
  const [user, setUser] = useState<User | null>(() => storage.get('current_user', null));
  const [users, setUsers] = useState<User[]>(() => storage.get('all_users', []));
  const [hotels, setHotels] = useState<Hotel[]>(() => storage.get('hotels', INITIAL_HOTELS));
  const [menu, setMenu] = useState<MenuItem[]>(() => storage.get('menu', INITIAL_MENU));
  const [orders, setOrders] = useState<Order[]>(() => storage.get('orders', []));
  const [coupons, setCoupons] = useState<Coupon[]>(() => storage.get('coupons', INITIAL_COUPONS));
  const [banners, setBanners] = useState<Banner[]>(() => storage.get('banners', INITIAL_BANNERS));
  const [settings, setSettings] = useState<AppSettings>(() => storage.get('settings', INITIAL_SETTINGS));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

  // Sync state to LocalStorage
  useEffect(() => { storage.set('all_users', users); }, [users]);
  useEffect(() => { storage.set('hotels', hotels); }, [hotels]);
  useEffect(() => { storage.set('menu', menu); }, [menu]);
  useEffect(() => { storage.set('orders', orders); }, [orders]);
  useEffect(() => { storage.set('coupons', coupons); }, [coupons]);
  useEffect(() => { storage.set('banners', banners); }, [banners]);
  useEffect(() => { storage.set('settings', settings); }, [settings]);
  useEffect(() => { storage.set('current_user', user); }, [user]);

  // --- Auth Handlers ---
  const handleSignup = (name: string, mobile: string, pass: string) => {
    if (users.find(u => u.mobile === mobile)) {
      alert("Mobile number already registered!");
      return;
    }
    const newUser = { id: Date.now().toString(), name, mobile, password: pass };
    setUsers([...users, newUser]);
    setUser(newUser);
    setView('HOME');
  };

  const handleLogin = (mobile: string, pass: string) => {
    const found = users.find(u => u.mobile === mobile && u.password === pass);
    if (found) {
      setUser(found);
      setView('HOME');
    } else {
      alert("Invalid credentials!");
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('LOGIN');
    setCart([]);
  };

  // --- Cart Logic ---
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const cartSubtotal = useMemo(() => cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0), [cart]);
  const cartTotal = useMemo(() => {
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    return Math.max(0, cartSubtotal + settings.deliveryFee + settings.platformFee + settings.surcharge - discount);
  }, [cartSubtotal, settings, appliedCoupon]);

  // --- Order Logic ---
  const placeOrder = (details: { address: string, deliveryTime: string, paymentMethod: 'Online' | 'COD', transactionId?: string }) => {
    if (!user) return;
    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      userName: user.name,
      userMobile: user.mobile,
      hotelId: selectedHotel?.id || 'unknown',
      hotelName: selectedHotel?.name || 'Multiple',
      items: [...cart],
      subtotal: cartSubtotal,
      deliveryFee: settings.deliveryFee,
      platformFee: settings.platformFee,
      surcharge: settings.surcharge,
      discount: appliedCoupon?.discount || 0,
      total: cartTotal,
      address: details.address,
      deliveryTime: details.deliveryTime,
      paymentMethod: details.paymentMethod,
      transactionId: details.transactionId,
      status: 'Pending',
      timestamp: Date.now()
    };
    setOrders([newOrder, ...orders]);
    setLastOrder(newOrder);
    setCart([]);
    setAppliedCoupon(null);
    setView('ORDER_CONFIRMATION');
  };

  // --- Components ---

  const Header = () => (
    <header className="bg-yellow-400 text-orange-900 p-4 sticky top-0 z-40 shadow-md flex items-center justify-between">
      <div className="flex items-center gap-3">
        {user && (
          <button onClick={() => setSidebarOpen(true)} className="p-1 hover:bg-yellow-500 rounded-full transition">
            <MenuIcon size={24} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover shadow-sm" />
          <h1 className="text-xl font-bold tracking-tight">{settings.appName}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {view === 'HOME' && user && (
           <button onClick={() => setView('CART')} className="relative p-2 hover:bg-yellow-500 rounded-full transition">
           <ShoppingCart size={22} />
           {cart.length > 0 && (
             <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-yellow-400">
               {cart.length}
             </span>
           )}
         </button>
        )}
        {!user && (
          <button onClick={() => setView('ADMIN_LOGIN')} className="p-2 opacity-50 hover:opacity-100 transition">
            <ShieldCheck size={20} />
          </button>
        )}
      </div>
    </header>
  );

  const Sidebar = () => (
    <>
      <div className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)} />
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-50 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 text-white relative">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-1 bg-white/20 rounded-full">
            <X size={20} />
          </button>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg border-2 border-white/50">
            <UserIcon size={32} className="text-orange-500" />
          </div>
          <h3 className="text-lg font-bold">{user?.name}</h3>
          <p className="text-sm opacity-90">{user?.mobile}</p>
        </div>
        <nav className="p-4 space-y-2">
          <button onClick={() => { setView('HOME'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"><LayoutDashboard size={20} /> Home</button>
          <button onClick={() => { setView('ORDER_HISTORY'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"><History size={20} /> Order History</button>
          <button onClick={() => { setView('COUPONS'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"><Gift size={20} /> My Coupons</button>
          <button onClick={() => { setView('REWARDS'); setSidebarOpen(false); }} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"><Gift size={20} /> Rewards</button>
          <a href="https://wa.me/918114720156" target="_blank" className="flex items-center gap-3 p-3 text-gray-700 hover:bg-green-50 hover:text-green-600 rounded-lg transition"><MessageCircle size={20} /> Contact Us</a>
          <button onClick={() => { alert(settings.aboutUs); setSidebarOpen(false); }} className="w-full flex items-center gap-3 p-3 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition"><Info size={20} /> About Us</button>
          <hr className="my-4 border-gray-100" />
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"><LogOut size={20} /> Logout</button>
        </nav>
      </div>
    </>
  );

  const LoginPage = () => {
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-yellow-50 to-orange-100">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <img src={settings.logoUrl} alt="Logo" className="w-20 h-20 mx-auto rounded-full shadow-md" />
            <h2 className="text-3xl font-extrabold text-orange-600">{settings.appName}</h2>
            <p className="text-gray-500">Welcome back! Login to continue</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Mobile Number</label>
              <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" placeholder="Enter mobile" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" placeholder="Enter password" />
            </div>
            <button onClick={() => handleLogin(mobile, password)} className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-200">Login</button>
          </div>
          <p className="text-center text-gray-500">
            Don't have an account? <button onClick={() => setView('SIGNUP')} className="text-orange-600 font-bold hover:underline">Sign Up</button>
          </p>
        </div>
      </div>
    );
  };

  const SignupPage = () => {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-yellow-50 to-orange-100">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-orange-600">Create Account</h2>
            <p className="text-gray-500">Join {settings.appName} today!</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" placeholder="Enter full name" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Mobile Number</label>
              <input type="tel" value={mobile} onChange={e => setMobile(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" placeholder="Enter mobile" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-600">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none transition" placeholder="Create password" />
            </div>
            <button onClick={() => handleSignup(name, mobile, password)} className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold text-lg hover:bg-orange-600 transition shadow-lg shadow-orange-200">Sign Up</button>
          </div>
          <p className="text-center text-gray-500">
            Already have an account? <button onClick={() => setView('LOGIN')} className="text-orange-600 font-bold hover:underline">Login</button>
          </p>
        </div>
      </div>
    );
  };

  const HomePage = () => (
    <main className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
      {/* Banner Slider (Mock) */}
      <div className="overflow-x-auto flex gap-4 pb-2 snap-x hide-scrollbar">
        {banners.map(b => (
          <div key={b.id} className="min-w-[85%] h-44 rounded-2xl overflow-hidden shadow-md relative snap-center">
            <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
              <h3 className="text-white font-bold text-lg">{b.title}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <MapPin size={20} className="text-orange-500" />
        <span className="font-semibold text-gray-700">Hotel Near by You</span>
      </div>

      <div className="space-y-4">
        {hotels.filter(h => h.isOpen).map(hotel => (
          <div 
            key={hotel.id} 
            onClick={() => { setSelectedHotel(hotel); setView('HOTEL_DETAILS'); }}
            className="bg-white rounded-2xl p-3 flex gap-4 shadow-sm hover:shadow-md transition border border-transparent hover:border-yellow-200 cursor-pointer"
          >
            <img src={hotel.image} alt={hotel.name} className="w-24 h-24 rounded-xl object-cover" />
            <div className="flex flex-col justify-center flex-1">
              <h3 className="font-bold text-lg text-gray-800">{hotel.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{hotel.description}</p>
              <div className="mt-2 flex items-center text-orange-500 font-semibold text-xs">
                View Menu <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
        {hotels.filter(h => h.isOpen).length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Info size={40} className="mx-auto mb-2 opacity-20" />
            <p>No hotels available at the moment.</p>
          </div>
        )}
      </div>
    </main>
  );

  const HotelDetails = () => (
    <div className="pb-24 max-w-2xl mx-auto">
      <div className="relative h-56">
        <img src={selectedHotel?.image} alt={selectedHotel?.name} className="w-full h-full object-cover" />
        <button onClick={() => setView('HOME')} className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-lg"><ArrowLeft size={20} /></button>
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 p-6 text-white w-full">
          <h2 className="text-3xl font-bold">{selectedHotel?.name}</h2>
          <p className="text-white/80 text-sm">{selectedHotel?.description}</p>
        </div>
      </div>
      <div className="p-4 space-y-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingCart size={20} className="text-orange-500" /> Our Menu
        </h3>
        <div className="space-y-4">
          {menu.filter(m => m.hotelId === selectedHotel?.id && m.isAvailable).map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl flex gap-4 shadow-sm border border-gray-100">
              <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-orange-600 text-lg">₹{item.price}</span>
                  <button onClick={() => addToCart(item)} className="bg-yellow-400 text-orange-900 px-4 py-1.5 rounded-full font-bold text-sm hover:bg-yellow-500 transition shadow-sm active:scale-95">Add to Cart</button>
                </div>
              </div>
            </div>
          ))}
          {menu.filter(m => m.hotelId === selectedHotel?.id && m.isAvailable).length === 0 && (
            <p className="text-center py-10 text-gray-400 italic">No items available in the menu yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  const CartPage = () => {
    const [couponCode, setCouponCode] = useState('');
    const applyCoupon = () => {
      const found = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
      if (found) {
        setAppliedCoupon(found);
        setCouponCode('');
        alert("Coupon Applied Successfully!");
      } else {
        alert("Invalid Coupon Code");
      }
    };

    if (cart.length === 0) return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="bg-orange-100 p-8 rounded-full mb-6">
          <ShoppingCart size={80} className="text-orange-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Look like you haven't added anything to your cart yet.</p>
        <button onClick={() => setView('HOME')} className="bg-orange-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-orange-100 hover:scale-105 transition">Explore Hotels</button>
      </div>
    );

    return (
      <div className="p-4 space-y-6 pb-32 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setView('HOTEL_DETAILS')} className="bg-white p-2 rounded-full shadow-sm border border-gray-100"><ArrowLeft size={18} /></button>
          <h2 className="text-2xl font-bold text-gray-800">My Cart</h2>
        </div>
        <div className="space-y-4">
          {cart.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-50">
              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1">
                <h4 className="font-bold text-gray-800">{item.name}</h4>
                <p className="text-sm font-extrabold text-orange-600">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-3 bg-orange-50 rounded-full px-3 py-1.5">
                <button onClick={() => updateCartQty(item.id, -1)} className="text-orange-600 hover:bg-orange-100 rounded-full p-1"><Minus size={16} /></button>
                <span className="font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateCartQty(item.id, 1)} className="text-orange-600 hover:bg-orange-100 rounded-full p-1"><Plus size={16} /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 space-y-4">
          <h3 className="font-bold text-gray-800 border-b pb-2">Apply Coupon</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponCode} 
              onChange={e => setCouponCode(e.target.value)} 
              placeholder="Enter code (e.g. WELCOME50)" 
              className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-400 uppercase font-bold"
            />
            <button onClick={applyCoupon} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition">Apply</button>
          </div>
          {appliedCoupon && (
            <div className="flex items-center justify-between bg-green-50 text-green-700 p-3 rounded-xl border border-green-100">
              <span className="text-sm font-semibold">Applied: <span className="font-bold">{appliedCoupon.code}</span> (₹{appliedCoupon.discount} off)</span>
              <button onClick={() => setAppliedCoupon(null)} className="p-1 hover:bg-green-100 rounded-full"><X size={14} /></button>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-50 space-y-3">
          <div className="flex justify-between text-gray-600"><span className="text-sm">Item Total</span><span className="font-medium text-gray-800">₹{cartSubtotal}</span></div>
          <div className="flex justify-between text-gray-600"><span className="text-sm">Delivery Fee</span><span className="font-medium text-gray-800">₹{settings.deliveryFee}</span></div>
          <div className="flex justify-between text-gray-600"><span className="text-sm">Platform Fee</span><span className="font-medium text-gray-800">₹{settings.platformFee}</span></div>
          {settings.surcharge > 0 && <div className="flex justify-between text-gray-600"><span className="text-sm">Surcharge</span><span className="font-medium text-gray-800">₹{settings.surcharge}</span></div>}
          {appliedCoupon && <div className="flex justify-between text-green-600"><span className="text-sm font-medium">Coupon Discount</span><span className="font-bold">-₹{appliedCoupon.discount}</span></div>}
          <hr className="my-2 border-gray-100" />
          <div className="flex justify-between text-xl font-extrabold text-gray-800"><span>To Pay</span><span className="text-orange-600">₹{cartTotal}</span></div>
        </div>

        <button 
          onClick={() => setView('CHECKOUT')} 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xl bg-orange-500 text-white p-4 rounded-2xl font-bold text-lg flex items-center justify-between shadow-2xl shadow-orange-200 hover:bg-orange-600 transition"
        >
          <span>Checkout • {cart.length} Item(s)</span>
          <div className="flex items-center gap-1">₹{cartTotal} <ChevronRight size={20} /></div>
        </button>
      </div>
    );
  };

  const CheckoutPage = () => {
    const [address, setAddress] = useState('');
    const [deliveryTime, setDeliveryTime] = useState(settings.deliveryTimes[0] || 'ASAP');
    const [paymentMethod, setPaymentMethod] = useState<'Online' | 'COD'>('Online');
    const [transactionId, setTransactionId] = useState('');

    const upiId = "8637222358@upi";
    const upiUrl = `upi://pay?pa=${upiId}&pn=FoodieWe&am=${cartTotal}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

    return (
      <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setView('CART')} className="bg-white p-2 rounded-full shadow-sm border border-gray-100"><ArrowLeft size={18} /></button>
          <h2 className="text-2xl font-bold text-gray-800">Place Order</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5 border border-gray-50">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1">Deliver to</label>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex items-center gap-3">
                <div className="bg-white p-2 rounded-full text-orange-600"><MapPin size={18} /></div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.mobile}</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1">Full Address</label>
              <textarea 
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-400" 
                placeholder="Building, Street, Landmark, Area..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 block mb-1">Select Delivery Time</label>
              <div className="grid grid-cols-2 gap-2">
                {settings.deliveryTimes.map(time => (
                  <button 
                    key={time} 
                    onClick={() => setDeliveryTime(time)} 
                    className={`p-3 rounded-xl border font-semibold text-sm transition ${deliveryTime === time ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-600 border-gray-100 hover:border-orange-200'}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5 border border-gray-50">
          <h3 className="font-bold text-gray-800">Payment Method</h3>
          <div className="space-y-3">
            <button 
              onClick={() => setPaymentMethod('Online')} 
              className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition ${paymentMethod === 'Online' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
            >
              <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${paymentMethod === 'Online' ? 'border-orange-500 bg-white' : 'border-gray-200'}`}>
                {paymentMethod === 'Online' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-800">Pay Online (UPI)</p>
                <p className="text-xs text-gray-500">Scan QR or Pay to {upiId}</p>
              </div>
              <QrCode className="text-orange-500 opacity-40" />
            </button>
            <button 
              onClick={() => setPaymentMethod('COD')} 
              className={`w-full p-4 rounded-2xl border flex items-center gap-4 transition ${paymentMethod === 'COD' ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}
            >
              <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-orange-500 bg-white' : 'border-gray-200'}`}>
                {paymentMethod === 'COD' && <div className="w-2 h-2 rounded-full bg-orange-500" />}
              </div>
              <div className="flex-1 text-left font-bold text-gray-800">Cash on Delivery</div>
            </button>
          </div>

          {paymentMethod === 'Online' && (
            <div className="mt-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center space-y-4">
              <p className="font-bold text-orange-700 text-sm">Scan QR & Pay ₹{cartTotal}</p>
              <img src={qrUrl} alt="UPI QR" className="mx-auto w-40 h-40 bg-white p-2 rounded-xl shadow-sm" />
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 block">Enter Last 4 Digits of Transaction ID</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={transactionId}
                  onChange={e => setTransactionId(e.target.value.replace(/\D/g, ''))}
                  placeholder="XXXX"
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-400 text-center font-bold tracking-[0.5em] text-lg"
                />
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={() => {
            if (!address.trim()) return alert("Please enter delivery address");
            if (paymentMethod === 'Online' && transactionId.length < 4) return alert("Please enter last 4 digits of transaction ID");
            placeOrder({ address, deliveryTime, paymentMethod, transactionId });
          }} 
          className="w-full bg-green-600 text-white p-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition shadow-xl shadow-green-100 active:scale-[0.98]"
        >
          Confirm Order
        </button>
      </div>
    );
  };

  const OrderConfirmation = () => (
    <div className="flex flex-col items-center justify-center min-h-[90vh] p-6 text-center max-w-2xl mx-auto">
      <div className="bg-green-100 p-8 rounded-full mb-6 text-green-600 animate-bounce">
        <CheckCircle2 size={100} />
      </div>
      <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Order Confirmed!</h2>
      <p className="text-gray-500 mb-8">Thank you for ordering with {settings.appName}. Your food is being prepared.</p>
      
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-left space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <span className="text-sm font-bold text-gray-500 uppercase">Order ID</span>
          <span className="font-extrabold text-orange-600">{lastOrder?.id}</span>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-bold text-gray-500 uppercase">Items Summary</span>
          {lastOrder?.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}x {item.name}</span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 flex justify-between font-bold text-lg">
          <span>Total Paid</span>
          <span className="text-orange-600">₹{lastOrder?.total}</span>
        </div>
        <div className="bg-orange-50 p-3 rounded-xl flex gap-3">
          <MapPin size={18} className="text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600 leading-relaxed">{lastOrder?.address}</p>
        </div>
      </div>

      <button onClick={() => setView('HOME')} className="mt-8 bg-orange-500 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:scale-105 transition">Back to Home</button>
    </div>
  );

  const OrderHistory = () => (
    <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
       <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setView('HOME')} className="bg-white p-2 rounded-full shadow-sm border border-gray-100"><ArrowLeft size={18} /></button>
          <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
        </div>
        <div className="space-y-4">
          {orders.filter(o => o.userId === user?.id).map(order => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800">{order.hotelName}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{order.id} • {new Date(order.timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${order.status === 'Accepted' ? 'bg-green-100 text-green-700' : order.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>{order.status}</span>
              </div>
              <div className="space-y-1">
                {order.items.map(item => (
                  <p key={item.id} className="text-xs text-gray-600">{item.quantity}x {item.name}</p>
                ))}
              </div>
              <div className="flex justify-between items-center border-t pt-3">
                <span className="text-sm font-bold text-orange-600">₹{order.total}</span>
                <button className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-orange-500">View Details</button>
              </div>
            </div>
          ))}
          {orders.filter(o => o.userId === user?.id).length === 0 && (
             <div className="text-center py-20 text-gray-400">
               <History size={60} className="mx-auto mb-2 opacity-10" />
               <p>No past orders found.</p>
             </div>
          )}
        </div>
    </div>
  );

  const AdminLoginPage = () => {
    const [id, setId] = useState('');
    const [pass, setPass] = useState('');
    const handleAdminLogin = () => {
      if (id === '8637222358' && pass === '8637222') {
        setView('ADMIN_DASHBOARD');
      } else {
        alert("Incorrect Admin Credentials");
      }
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-900 text-white">
        <div className="w-full max-w-md bg-white/10 p-8 rounded-3xl backdrop-blur-md border border-white/10 space-y-6">
          <div className="text-center space-y-2">
            <ShieldCheck size={60} className="mx-auto text-yellow-400" />
            <h2 className="text-2xl font-bold">Admin Portal</h2>
            <p className="text-white/60">Secure Access Required</p>
          </div>
          <div className="space-y-4">
            <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white" placeholder="Admin ID" />
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full p-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white" placeholder="Password" />
            <button onClick={handleAdminLogin} className="w-full bg-yellow-400 text-gray-900 p-4 rounded-2xl font-extrabold text-lg shadow-lg hover:bg-yellow-500 transition">Unlock Dashboard</button>
            <button onClick={() => setView('LOGIN')} className="w-full text-white/50 py-2 hover:text-white transition">Exit Admin Portal</button>
          </div>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState<'Hotels' | 'Orders' | 'Settings' | 'Inventory' | 'Banners'>('Orders');
    
    // Stats
    const totalEarnings = orders.filter(o => o.status !== 'Rejected').reduce((acc, curr) => acc + curr.total, 0);
    const dailyOrderCount = orders.filter(o => new Date(o.timestamp).toDateString() === new Date().toDateString()).length;

    const copyOrderDetails = (order: Order) => {
      const text = `Order ID: ${order.id}\nCustomer: ${order.userName} (${order.userMobile})\nHotel: ${order.hotelName}\nItems: ${order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}\nAddress: ${order.address}\nTotal: ₹${order.total}\nPayment: ${order.paymentMethod} ${order.transactionId ? `(Tx: ${order.transactionId})` : ''}`;
      navigator.clipboard.writeText(text);
      alert("Order details copied to clipboard!");
    };

    const updateOrderStatus = (id: string, status: Order['status']) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };

    const HotelManager = () => {
      const [showAdd, setShowAdd] = useState(false);
      const [name, setName] = useState('');
      const [desc, setDesc] = useState('');
      const [img, setImg] = useState('https://picsum.photos/400/300?random=' + Math.random());
      const handleAdd = () => {
        if (!name || !desc) return;
        setHotels([...hotels, { id: 'h' + Date.now(), name, description: desc, image: img, isOpen: true }]);
        setShowAdd(false);
      };
      return (
        <div className="space-y-4">
          <button onClick={() => setShowAdd(true)} className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Plus size={20} /> Add New Hotel</button>
          {showAdd && (
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-blue-100 space-y-4">
              <h4 className="font-bold text-lg">Add Hotel Details</h4>
              <input type="text" placeholder="Hotel Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <input type="text" placeholder="Image URL" value={img} onChange={e => setImg(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold">Save Hotel</button>
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 p-3 rounded-xl font-bold text-gray-500">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {hotels.map(h => (
              <div key={h.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100">
                <img src={h.image} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{h.name}</h4>
                  <p className="text-xs text-gray-400 line-clamp-1">{h.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setHotels(hotels.map(hotel => hotel.id === h.id ? { ...hotel, isOpen: !hotel.isOpen } : hotel))}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition ${h.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {h.isOpen ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => setHotels(hotels.filter(hotel => hotel.id !== h.id))} className="text-red-500 p-2"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const InventoryManager = () => {
      const [showAdd, setShowAdd] = useState(false);
      const [hId, setHId] = useState(hotels[0]?.id || '');
      const [name, setName] = useState('');
      const [price, setPrice] = useState('');
      const [desc, setDesc] = useState('');
      const [img, setImg] = useState('https://picsum.photos/200/200?random=' + Math.random());

      const handleAdd = () => {
        if (!name || !price || !hId) return;
        setMenu([...menu, { id: 'm' + Date.now(), hotelId: hId, name, price: Number(price), description: desc, image: img, isAvailable: true }]);
        setShowAdd(false);
      };

      return (
        <div className="space-y-4">
          <button onClick={() => setShowAdd(true)} className="w-full p-4 bg-purple-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Plus size={20} /> Add New Menu Item</button>
          {showAdd && (
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-purple-100 space-y-4">
              <h4 className="font-bold text-lg">New Item Details</h4>
              <select value={hId} onChange={e => setHId(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl">
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <input type="text" placeholder="Item Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <textarea placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <input type="text" placeholder="Image URL" value={img} onChange={e => setImg(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <div className="flex gap-2">
                <button onClick={handleAdd} className="flex-1 bg-purple-600 text-white p-3 rounded-xl font-bold">Save Item</button>
                <button onClick={() => setShowAdd(false)} className="flex-1 bg-gray-100 p-3 rounded-xl font-bold text-gray-500">Cancel</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {menu.map(m => (
              <div key={m.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-gray-100">
                <img src={m.image} className="w-14 h-14 rounded-xl object-cover" />
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800">{m.name}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-600">₹{m.price}</span>
                    <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-500">{hotels.find(h => h.id === m.hotelId)?.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setMenu(menu.map(item => item.id === m.id ? { ...item, isAvailable: !item.isAvailable } : item))}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition ${m.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {m.isAvailable ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => setMenu(menu.filter(item => item.id !== m.id))} className="text-red-500 p-2"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const SettingsManager = () => {
      const [df, setDf] = useState(settings.deliveryFee.toString());
      const [pf, setPf] = useState(settings.platformFee.toString());
      const [sc, setSc] = useState(settings.surcharge.toString());
      const [about, setAbout] = useState(settings.aboutUs);
      const [times, setTimes] = useState(settings.deliveryTimes.join(', '));
      const [newCouponCode, setNewCouponCode] = useState('');
      const [newCouponDiscount, setNewCouponDiscount] = useState('');

      const saveSettings = () => {
        setSettings({
          ...settings,
          deliveryFee: Number(df),
          platformFee: Number(pf),
          surcharge: Number(sc),
          aboutUs: about,
          deliveryTimes: times.split(',').map(t => t.trim()).filter(t => t)
        });
        alert("Settings Saved!");
      };

      const addCoupon = () => {
        if (!newCouponCode || !newCouponDiscount) return;
        setCoupons([...coupons, { id: 'c' + Date.now(), code: newCouponCode.toUpperCase(), discount: Number(newCouponDiscount), description: `₹${newCouponDiscount} Discount Coupon` }]);
        setNewCouponCode('');
        setNewCouponDiscount('');
      };

      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h4 className="font-bold text-lg border-b pb-2">Global Fees</h4>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Delivery</label><input type="number" value={df} onChange={e => setDf(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Platform</label><input type="number" value={pf} onChange={e => setPf(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg" /></div>
              <div><label className="text-[10px] font-bold text-gray-500 uppercase">Surcharge</label><input type="number" value={sc} onChange={e => setSc(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg" /></div>
            </div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">Delivery Times (Comma Separated)</label><input type="text" value={times} onChange={e => setTimes(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg" /></div>
            <div><label className="text-[10px] font-bold text-gray-500 uppercase">About Us Text</label><textarea value={about} onChange={e => setAbout(e.target.value)} className="w-full p-2 bg-gray-50 rounded-lg h-24" /></div>
            <button onClick={saveSettings} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">Update Configuration</button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h4 className="font-bold text-lg border-b pb-2">Coupons & Offers</h4>
            <div className="flex gap-2">
              <input type="text" placeholder="CODE" value={newCouponCode} onChange={e => setNewCouponCode(e.target.value)} className="flex-1 p-2 bg-gray-50 rounded-lg font-bold" />
              <input type="number" placeholder="Amt" value={newCouponDiscount} onChange={e => setNewCouponDiscount(e.target.value)} className="w-20 p-2 bg-gray-50 rounded-lg" />
              <button onClick={addCoupon} className="bg-green-600 text-white px-4 rounded-lg font-bold"><Plus size={18} /></button>
            </div>
            <div className="space-y-2">
              {coupons.map(c => (
                <div key={c.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="font-bold">{c.code} (₹{c.discount})</span>
                  <button onClick={() => setCoupons(coupons.filter(coupon => coupon.id !== c.id))} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    };

    const BannerManager = () => {
      const [url, setUrl] = useState('');
      const [title, setTitle] = useState('');
      const handleAdd = () => {
        if (!url) return;
        setBanners([...banners, { id: 'b' + Date.now(), imageUrl: url, title }]);
        setUrl('');
        setTitle('');
      };
      return (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
            <h4 className="font-bold text-lg border-b pb-2">Manage Banners</h4>
            <input type="text" placeholder="Banner URL" value={url} onChange={e => setUrl(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
            <input type="text" placeholder="Title (Optional)" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl" />
            <button onClick={handleAdd} className="w-full bg-orange-500 text-white p-3 rounded-xl font-bold">Add Banner</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {banners.map(b => (
              <div key={b.id} className="relative group rounded-xl overflow-hidden shadow-sm">
                <img src={b.imageUrl} className="w-full h-24 object-cover" />
                <button onClick={() => setBanners(banners.filter(banner => banner.id !== b.id))} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="bg-gray-50 min-h-screen pb-24">
        <header className="bg-white p-6 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900">ADMIN CONTROL</h2>
            <div className="flex gap-4 mt-2">
              <div className="bg-orange-50 px-3 py-1 rounded-full flex items-center gap-1.5"><ShoppingCart size={14} className="text-orange-500" /><span className="text-xs font-bold text-orange-700">{dailyOrderCount} Today</span></div>
              <div className="bg-green-50 px-3 py-1 rounded-full flex items-center gap-1.5"><Gift size={14} className="text-green-500" /><span className="text-xs font-bold text-green-700">₹{totalEarnings} Total</span></div>
            </div>
          </div>
          <button onClick={() => setView('LOGIN')} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition"><LogOut size={22} /></button>
        </header>

        <nav className="flex overflow-x-auto p-4 gap-2 bg-white sticky top-0 z-10 no-scrollbar border-b">
          {(['Orders', 'Hotels', 'Inventory', 'Settings', 'Banners'] as const).map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition ${activeTab === tab ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {tab}
            </button>
          ))}
        </nav>

        <div className="p-4 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === 'Orders' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">Live Orders <span className="text-sm bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{orders.filter(o => o.status === 'Pending').length}</span></h3>
              {orders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-gray-900">{order.userName}</h4>
                      <p className="text-xs text-gray-400 font-bold">{order.id} • {new Date(order.timestamp).toLocaleTimeString()}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-bold">
                        <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{order.hotelName}</span>
                        <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">₹{order.total} • {order.paymentMethod}</span>
                      </div>
                    </div>
                    <button onClick={() => copyOrderDetails(order)} className="p-2 text-gray-400 hover:text-blue-500 transition"><Copy size={18} /></button>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-2xl space-y-1">
                    {order.items.map(i => <p key={i.id} className="text-xs text-gray-600 font-medium">{i.quantity}x {i.name}</p>)}
                    <hr className="my-2 border-gray-100" />
                    <p className="text-[10px] text-gray-500 leading-tight flex items-start gap-1"><MapPin size={10} className="shrink-0 mt-0.5" /> {order.address}</p>
                  </div>
                  {order.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button onClick={() => updateOrderStatus(order.id, 'Accepted')} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold text-sm shadow-md active:scale-95">Accept Order</button>
                      <button onClick={() => updateOrderStatus(order.id, 'Rejected')} className="flex-1 bg-red-50 text-red-600 p-3 rounded-xl font-bold text-sm hover:bg-red-100 active:scale-95">Reject</button>
                    </div>
                  ) : (
                    <div className={`w-full p-3 rounded-xl text-center font-bold text-sm ${order.status === 'Accepted' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {order.status === 'Accepted' ? '✅ ORDER ACCEPTED' : '❌ ORDER REJECTED'}
                    </div>
                  )}
                </div>
              ))}
              {orders.length === 0 && <p className="text-center py-20 text-gray-300">No orders placed yet.</p>}
            </div>
          )}
          {activeTab === 'Hotels' && <HotelManager />}
          {activeTab === 'Inventory' && <InventoryManager />}
          {activeTab === 'Settings' && <SettingsManager />}
          {activeTab === 'Banners' && <BannerManager />}
        </div>
      </div>
    );
  };

  // --- Router ---
  const renderView = () => {
    switch (view) {
      case 'LOGIN': return <LoginPage />;
      case 'SIGNUP': return <SignupPage />;
      case 'HOME': return <HomePage />;
      case 'HOTEL_DETAILS': return <HotelDetails />;
      case 'CART': return <CartPage />;
      case 'CHECKOUT': return <CheckoutPage />;
      case 'ORDER_CONFIRMATION': return <OrderConfirmation />;
      case 'ORDER_HISTORY': return <OrderHistory />;
      case 'COUPONS': return (
        <div className="p-4 space-y-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setView('HOME')} className="bg-white p-2 rounded-full shadow-sm"><ArrowLeft size={18} /></button>
            <h2 className="text-2xl font-bold">My Coupons</h2>
          </div>
          {coupons.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-3xl border-2 border-dashed border-orange-200 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-orange-500 text-white px-4 py-1 rounded-bl-xl font-bold text-xs">₹{c.discount} OFF</div>
               <h3 className="text-xl font-black text-orange-600 mb-1">{c.code}</h3>
               <p className="text-sm text-gray-500">{c.description}</p>
            </div>
          ))}
        </div>
      );
      case 'REWARDS': return (
        <div className="p-4 space-y-4 max-w-2xl mx-auto text-center">
          <div className="flex items-center gap-4 mb-8 text-left">
            <button onClick={() => setView('HOME')} className="bg-white p-2 rounded-full shadow-sm"><ArrowLeft size={18} /></button>
            <h2 className="text-2xl font-bold">Rewards</h2>
          </div>
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-3xl text-white shadow-xl shadow-orange-100">
             <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Gift size={32} /></div>
             <h3 className="text-2xl font-bold mb-2">Available Points: 150</h3>
             <p className="text-white/80 text-sm">Keep ordering to earn more points!</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm mt-4 text-left">
            <h4 className="font-bold text-gray-800 mb-2">How it works?</h4>
            <p className="text-sm text-gray-500 leading-relaxed">{settings.rewardInfo}</p>
          </div>
        </div>
      );
      case 'ADMIN_LOGIN': return <AdminLoginPage />;
      case 'ADMIN_DASHBOARD': return <AdminDashboard />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen select-none">
      {!['LOGIN', 'SIGNUP', 'ADMIN_LOGIN', 'ADMIN_DASHBOARD'].includes(view) && <Header />}
      {!['LOGIN', 'SIGNUP', 'ADMIN_LOGIN', 'ADMIN_DASHBOARD'].includes(view) && <Sidebar />}
      {renderView()}
    </div>
  );
};

export default App;
