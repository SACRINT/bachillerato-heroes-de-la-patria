import React, { useState, useEffect } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

interface MarketItem {
    listingId: number;
    itemId: number;
    name: string;
    price: string;
    seller: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    category: string;
}

/**
 * Semana 35: Tienda 3D en el Metaverso
 */
export default function MarketplaceShop() {
    const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
    const [items, setItems] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarketItems();
    }, []);

    const fetchMarketItems = async () => {
        // En producción: llamar a The Graph o backend
        setItems([
            { listingId: 1, itemId: 101, name: 'Gorra Espacial', price: '50', seller: '0x1234...', rarity: 'rare', category: 'CLOTHING' },
            { listingId: 2, itemId: 102, name: 'Mochila Rocket', price: '75', seller: '0x5678...', rarity: 'epic', category: 'ACCESSORY' },
            { listingId: 3, itemId: 103, name: 'Lentes VR', price: '120', seller: '0x9abc...', rarity: 'legendary', category: 'ACCESSORY' },
            { listingId: 4, itemId: 104, name: 'Camiseta Héroe', price: '25', seller: '0xdef0...', rarity: 'common', category: 'CLOTHING' },
        ]);
        setLoading(false);
    };

    const getRarityColor = (rarity: string) => {
        switch (rarity) {
            case 'common': return '#9E9E9E';
            case 'uncommon': return '#4CAF50';
            case 'rare': return '#2196F3';
            case 'epic': return '#9C27B0';
            case 'legendary': return '#FF9800';
            default: return '#FFFFFF';
        }
    };

    return (
        <group position={[80, 0, 50]} name="marketplace-shop">
            {/* Edificio de la tienda */}
            <RigidBody type="fixed" colliders="cuboid">
                <mesh position={[0, 5, 0]} castShadow receiveShadow>
                    <boxGeometry args={[25, 10, 20]} />
                    <meshStandardMaterial color="#37474F" />
                </mesh>
            </RigidBody>

            {/* Letrero */}
            <mesh position={[0, 11, 10]} castShadow>
                <boxGeometry args={[15, 3, 0.5]} />
                <meshStandardMaterial color="#1A237E" emissive="#1A237E" emissiveIntensity={0.3} />
            </mesh>
            <Text position={[0, 11, 10.3]} fontSize={1.2} color="#FFD700">
                🛒 MARKETPLACE
            </Text>

            {/* Suelo interior */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[23, 18]} />
                <meshStandardMaterial color="#263238" />
            </mesh>

            {/* Estantes con items */}
            {items.map((item, index) => {
                const row = Math.floor(index / 2);
                const col = index % 2;
                const x = (col - 0.5) * 8;
                const z = (row - 0.5) * 6;

                return (
                    <group key={item.listingId} position={[x, 0, z]}>
                        {/* Pedestal */}
                        <mesh position={[0, 0.75, 0]} castShadow>
                            <cylinderGeometry args={[1, 1.2, 1.5, 16]} />
                            <meshStandardMaterial color="#455A64" />
                        </mesh>

                        {/* Item (representación visual) */}
                        <mesh
                            position={[0, 2, 0]}
                            castShadow
                            onClick={() => setSelectedItem(item)}
                        >
                            <boxGeometry args={[1.5, 1.5, 1.5]} />
                            <meshStandardMaterial
                                color={getRarityColor(item.rarity)}
                                emissive={getRarityColor(item.rarity)}
                                emissiveIntensity={0.2}
                            />
                        </mesh>

                        {/* Etiqueta de precio */}
                        <Text
                            position={[0, 3.2, 0]}
                            fontSize={0.3}
                            color="#FFD700"
                            anchorX="center"
                        >
                            {item.price} IAC
                        </Text>
                        <Text
                            position={[0, 2.8, 0]}
                            fontSize={0.25}
                            color="#FFFFFF"
                            anchorX="center"
                        >
                            {item.name}
                        </Text>

                        {/* Indicador de rareza */}
                        <mesh position={[0, 1.6, 0.9]}>
                            <planeGeometry args={[1.2, 0.3]} />
                            <meshBasicMaterial color={getRarityColor(item.rarity)} />
                        </mesh>
                    </group>
                );
            })}

            {/* Panel de compra (cuando se selecciona un item) */}
            {selectedItem && (
                <Html position={[0, 6, 8]} center>
                    <div className="purchase-panel">
                        <h3>{selectedItem.name}</h3>
                        <div className={`rarity-badge ${selectedItem.rarity}`}>
                            {selectedItem.rarity.toUpperCase()}
                        </div>
                        <div className="price">
                            <span className="label">Precio:</span>
                            <span className="value">{selectedItem.price} IAC</span>
                        </div>
                        <div className="seller">
                            Vendedor: {selectedItem.seller}
                        </div>
                        <div className="actions">
                            <button className="buy-btn">🛒 Comprar</button>
                            <button className="close-btn" onClick={() => setSelectedItem(null)}>✕</button>
                        </div>
                    </div>
                </Html>
            )}

            {/* Iluminación */}
            <pointLight position={[0, 8, 0]} intensity={0.8} color="#FFF" />
            <pointLight position={[-8, 4, 0]} intensity={0.3} color="#7C4DFF" />
            <pointLight position={[8, 4, 0]} intensity={0.3} color="#FFD700" />
        </group>
    );
}
