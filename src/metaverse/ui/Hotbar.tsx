import React from 'react'
import './Hotbar.css'

interface HotbarItem {
    id: string
    name: string
    icon: string
    quantity?: number
    isActive?: boolean
}

interface HotbarProps {
    items: HotbarItem[]
    activeSlot: number
    onSlotSelect: (index: number) => void
}

/**
 * Semana 7 Tarea #7: Sistema de inventario rápido (Hotbar)
 */
export default function Hotbar({ items, activeSlot, onSlotSelect }: HotbarProps) {
    // Siempre mostrar 9 slots
    const slots = Array(9).fill(null).map((_, i) => items[i] || null)

    return (
        <div className="hotbar-container">
            <div className="hotbar">
                {slots.map((item, index) => (
                    <button
                        key={index}
                        className={`hotbar-slot ${activeSlot === index ? 'active' : ''} ${item ? 'has-item' : ''}`}
                        onClick={() => onSlotSelect(index)}
                    >
                        <span className="slot-number">{index + 1}</span>
                        {item && (
                            <>
                                <span className="slot-icon">{item.icon}</span>
                                {item.quantity && item.quantity > 1 && (
                                    <span className="slot-quantity">{item.quantity}</span>
                                )}
                            </>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}
