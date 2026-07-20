import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Car Icon
const carIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/741/741407.png',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const socket = io('http://localhost:3000'); // Backend URL

const TrackingPage = () => {
    const { trackingNumber } = useParams();
    const [order, setOrder] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Get Initial Order Info
        const fetchOrder = async () => {
            try {
                const res = await fetch(`http://localhost:3000/api/delivery/track/${trackingNumber}`);
                const data = await res.json();
                if (data.success) {
                    setOrder(data.data);
                    if (data.data.driver?.location) {
                        setDriverLocation(data.data.driver.location);
                    }
                } else {
                    setOrder(null);
                }
            } catch (err) {
                console.error("Error fetching order", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();

        // 2. Connect Socket
        socket.emit('track_order', trackingNumber);

        socket.on('order_location_updated', (data) => {
            setDriverLocation({ lat: data.lat, lng: data.lng, heading: data.heading });
        });

        socket.on('order_status_updated', (data) => {
            setOrder(prev => prev ? ({ ...prev, status: data.status }) : null);
        });

        return () => {
            socket.off('order_location_updated');
            socket.off('order_status_updated');
        };
    }, [trackingNumber]);

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando ubicación del paquete...</p>
            </div>
        </div>
    );

    if (!order) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center max-w-md p-6 bg-white rounded-xl shadow-lg">
                <div className="text-4xl mb-4">📦❓</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Orden no encontrada</h2>
                <p className="text-gray-500">Verifica que el número de guía {trackingNumber} sea correcto.</p>
            </div>
        </div>
    );

    // Status mapping
    const getStatusLabel = (status) => {
        const map = {
            'created': 'Buscando conductor',
            'assigned': 'Conductor asignado',
            'at_pickup': 'En recolección',
            'picked_up': 'En camino',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
        };
        return map[status] || status;
    };

    const getStatusColor = (status) => {
        if (status === 'delivered') return 'bg-green-100 text-green-700 border-green-200';
        if (status === 'cancelled') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-blue-100 text-blue-700 border-blue-200';
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            {/* Header flotante */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg z-[1000] flex justify-between items-center border border-gray-100"
            >
                <div>
                    <h1 className="font-bold text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        Raite Envíos
                    </h1>
                    <p className="text-xs text-gray-500 font-mono mt-0.5 tracking-wider">{trackingNumber}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                </div>
            </motion.div>

            {/* Map */}
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={driverLocation ? [driverLocation.lat, driverLocation.lng] : [order.pickup.lat, order.pickup.lng]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        attribution='&copy; CARTO'
                    />

                    {/* Pickup Marker */}
                    <Marker position={[order.pickup.lat, order.pickup.lng]}>
                        <Popup>
                            <div className="text-center font-bold">📍 Recolección</div>
                            <div className="text-xs">{order.pickup.address}</div>
                        </Popup>
                    </Marker>

                    {/* Dropoff Marker */}
                    <Marker position={[order.dropoff.lat, order.dropoff.lng]}>
                        <Popup>
                            <div className="text-center font-bold">🏁 Entrega</div>
                            <div className="text-xs">{order.dropoff.address}</div>
                        </Popup>
                    </Marker>

                    {/* Driver Marker */}
                    {driverLocation && (
                        <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon}>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* Info Card (Bottom Sheet style) */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] -mt-6 z-20 relative px-6 py-8"
            >
                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl border border-gray-200 shadow-sm">
                        {order.driver ? "🚗" : "⌛"}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">
                            {order.driver ? order.driver.name : "Conectando..."}
                        </h3>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {order.driver ? `${order.driver.vehicle}` : "Asignando conductor cercano"}
                        </p>
                    </div>
                    <div className="text-right bg-blue-50 px-3 py-2 rounded-lg">
                        <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">LLEGADA</p>
                        <p className="font-bold text-gray-900 text-lg leading-none">{order.estimatedTime}</p>
                    </div>
                </div>

                {/* Status Steps */}
                <div className="relative pl-4 space-y-6">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-gray-200"></div>

                    {/* Step 1 */}
                    <div className="relative flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 ${['created', 'assigned', 'picked_up', 'delivered'].includes(order.status) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}></div>
                        <p className={`text-sm ${['created', 'assigned', 'picked_up', 'delivered'].includes(order.status) ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            Orden creada
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 ${['picked_up', 'delivered'].includes(order.status) ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}></div>
                        <p className={`text-sm ${['picked_up', 'delivered'].includes(order.status) ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            Paquete recolectado
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 ${order.status === 'delivered' ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}></div>
                        <p className={`text-sm ${order.status === 'delivered' ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                            Entregado
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TrackingPage;
