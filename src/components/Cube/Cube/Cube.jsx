import { useState, useEffect, useRef } from 'react';
import './Cube.css';

const Cube = () => {
    // Rotation state: start with a slight X tilt.
    const [rotation, setRotation] = useState({ x: 20, y: 0 });
    // Flag controlling auto-rotation (true = continuous rotation).
    const [isAutoRotating, setIsAutoRotating] = useState(true);
    // Timestamp of the last user interaction (for auto-resume).
    const [lastInteraction, setLastInteraction] = useState(null);
    // This flag is used to enable CSS transitions for manual (key-driven) updates.
    const [manualTransition, setManualTransition] = useState(false);

    // Ref for requestAnimationFrame ID and last timestamp.
    const animationRef = useRef(null);
    const lastTimeRef = useRef(null);
    const manualTransitionTimeoutRef = useRef(null);

    // Auto-rotation effect (runs without CSS transition).
    useEffect(() => {
        const autoRotate = (time) => {
        if (lastTimeRef.current !== null) {
            const delta = time - lastTimeRef.current;
            // Update rotation: 0.02° per ms.
            const increment = 0.02 * delta;
            setRotation((prev) => ({ ...prev, y: prev.y + increment }));
        }
        lastTimeRef.current = time;
        if (isAutoRotating) {
            animationRef.current = requestAnimationFrame(autoRotate);
        }
        };

        if (isAutoRotating) {
        // Reset the timestamp so no huge delta occurs.
        lastTimeRef.current = null;
        animationRef.current = requestAnimationFrame(autoRotate);
        }

        return () => {
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isAutoRotating]);

    // Auto-resume - set time untill resume here.
    useEffect(() => {
        let timeoutId;
        if (!isAutoRotating && lastInteraction) {
        timeoutId = setTimeout(() => {
            setIsAutoRotating(true);
        }, 1000);
        }
        return () => {
        if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isAutoRotating, lastInteraction]);

    // Keyboard controls: when an arrow key is pressed, disable auto-rotation
    // and perform a manual update with CSS transition.
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (isAutoRotating) {
                setIsAutoRotating(false);
            }
            setLastInteraction(Date.now());
            setManualTransition(true);
            if (e.key === 'ArrowLeft') {
                setRotation((prev) => ({ ...prev, y: prev.y - 45 }));
            } else if (e.key === 'ArrowRight') {
                setRotation((prev) => ({ ...prev, y: prev.y + 45 }));
            }
            // Clear any pending timeout, then set a new one.
            if (manualTransitionTimeoutRef.current) {
                clearTimeout(manualTransitionTimeoutRef.current);
            }
            manualTransitionTimeoutRef.current = setTimeout(() => {
                setManualTransition(false);
                manualTransitionTimeoutRef.current = null;
            }, 600);
            };
        
            window.addEventListener('keydown', handleKeyDown);
            return () => {
            window.removeEventListener('keydown', handleKeyDown);
            if (manualTransitionTimeoutRef.current) {
                clearTimeout(manualTransitionTimeoutRef.current);
            }
            };
        }, [isAutoRotating]);

    // On mouse enter, pause auto-rotation immediately.
    const handleMouseEnter = () => {
        if (isAutoRotating) {
        setIsAutoRotating(false);
        // Ensure that no transition is applied, so the cube simply freezes.
        setManualTransition(false);
        setLastInteraction(Date.now());
        }
    };

    return (
        <div className="cube-container">
        <div
            className="cube"
            style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            transition: manualTransition
                ? 'transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)'
                : 'none'
            }}
            onMouseEnter={handleMouseEnter}
        >
            <div className="cube-face cube-front">Front</div>
            <div className="cube-face cube-back">Back</div>
            <div className="cube-face cube-right">Right</div>
            <div className="cube-face cube-left">Left</div>
            <div className="cube-face cube-top">Top</div>
            <div className="cube-face cube-bottom">Bottom</div>
        </div>
        </div>
    );
};

export default Cube;
