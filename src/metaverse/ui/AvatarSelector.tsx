import React, { useState } from 'react'
import './AvatarSelector.css'

interface AvatarOption {
    id: string
    name: string
    thumbnail: string
    modelUrl: string
    colors?: { primary: string; secondary: string }
}

const DEFAULT_AVATARS: AvatarOption[] = [
    { id: 'avatar_hero_1', name: 'Héroe Clásico', thumbnail: '/avatars/hero1_thumb.png', modelUrl: '/avatars/hero1.glb' },
    { id: 'avatar_hero_2', name: 'Héroe Deportivo', thumbnail: '/avatars/hero2_thumb.png', modelUrl: '/avatars/hero2.glb' },
    { id: 'avatar_hero_3', name: 'Héroe Científico', thumbnail: '/avatars/hero3_thumb.png', modelUrl: '/avatars/hero3.glb' },
    { id: 'avatar_hero_4', name: 'Héroe Artístico', thumbnail: '/avatars/hero4_thumb.png', modelUrl: '/avatars/hero4.glb' },
    { id: 'avatar_hero_5', name: 'Héroe Tecnológico', thumbnail: '/avatars/hero5_thumb.png', modelUrl: '/avatars/hero5.glb' },
    { id: 'avatar_hero_6', name: 'Héroe Musical', thumbnail: '/avatars/hero6_thumb.png', modelUrl: '/avatars/hero6.glb' },
]

interface AvatarSelectorProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (avatar: AvatarOption) => void
    currentAvatarId?: string
}

/**
 * Semana 4 Tarea #6: Selector de avatares predefinidos
 */
export default function AvatarSelector({ isOpen, onClose, onSelect, currentAvatarId }: AvatarSelectorProps) {
    const [selectedId, setSelectedId] = useState(currentAvatarId || DEFAULT_AVATARS[0].id)
    const [primaryColor, setPrimaryColor] = useState('#3388ff')
    const [secondaryColor, setSecondaryColor] = useState('#ffffff')

    if (!isOpen) return null

    const handleConfirm = () => {
        const avatar = DEFAULT_AVATARS.find(a => a.id === selectedId)
        if (avatar) {
            onSelect({
                ...avatar,
                colors: { primary: primaryColor, secondary: secondaryColor }
            })
            onClose()
        }
    }

    return (
        <div className="avatar-selector-overlay" onClick={onClose}>
            <div className="avatar-selector-modal" onClick={(e) => e.stopPropagation()}>
                <div className="avatar-selector-header">
                    <h2>🎭 Elige tu Avatar</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="avatar-selector-body">
                    {/* Grid de avatares */}
                    <div className="avatar-grid">
                        {DEFAULT_AVATARS.map((avatar) => (
                            <button
                                key={avatar.id}
                                className={`avatar-option ${selectedId === avatar.id ? 'selected' : ''}`}
                                onClick={() => setSelectedId(avatar.id)}
                            >
                                <div className="avatar-thumbnail">
                                    <div className="avatar-placeholder">
                                        {avatar.name.charAt(0)}
                                    </div>
                                </div>
                                <span className="avatar-name">{avatar.name}</span>
                                {selectedId === avatar.id && <span className="check-mark">✓</span>}
                            </button>
                        ))}
                    </div>

                    {/* Editor de colores (Tarea #14) */}
                    <div className="color-editor">
                        <h3>🎨 Personalizar Colores</h3>
                        <div className="color-options">
                            <div className="color-option">
                                <label htmlFor="primary-color">Color Principal</label>
                                <input
                                    id="primary-color"
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    title="Seleccionar color principal"
                                />
                            </div>
                            <div className="color-option">
                                <label htmlFor="secondary-color">Color Secundario</label>
                                <input
                                    id="secondary-color"
                                    type="color"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    title="Seleccionar color secundario"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="avatar-selector-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="btn-confirm" onClick={handleConfirm}>Confirmar Avatar</button>
                </div>
            </div>
        </div>
    )
}

export { DEFAULT_AVATARS }
export type { AvatarOption }
