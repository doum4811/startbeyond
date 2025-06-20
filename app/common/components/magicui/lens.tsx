"use client";

import { motion, useMotionValue, useSpring, type SpringOptions } from "framer-motion";
import { useMemo, useState, useRef, useLayoutEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface LensProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  zoomFactor?: number;
  lensSize?: number;
  position?: Position;
  defaultPosition?: Position;
  isStatic?: boolean;
  duration?: number;
  lensColor?: string;
  ariaLabel?: string;
}

const DEFAULT_LENS_SIZE = 170;
const DEFAULT_ZOOM_FACTOR = 1.3;
const DEFAULT_DURATION = 0.1;

export function Lens({
  children,
  zoomFactor = DEFAULT_ZOOM_FACTOR,
  lensSize = DEFAULT_LENS_SIZE,
  position: controlledPosition,
  defaultPosition,
  isStatic = false,
  duration = DEFAULT_DURATION,
  lensColor,
  ariaLabel = "An interactive lens to zoom in on content",
  className,
  ...props
}: LensProps) {
  const [uncontrolledPosition, setPosition] = useState<Position | undefined>(
    defaultPosition,
  );
  const position = controlledPosition ?? uncontrolledPosition;
  const isVisible = position !== undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerBounds, setContainerBounds] = useState<DOMRect | undefined>();

  useLayoutEffect(() => {
    if (containerRef.current) {
      setContainerBounds(containerRef.current.getBoundingClientRect());
    }
  }, []);

  const springOptions: SpringOptions = {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  };

  const smoothMouse = {
    x: useSpring(useMotionValue(0), springOptions),
    y: useSpring(useMotionValue(0), springOptions),
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isStatic) return;

    if (containerRef.current) {
      setContainerBounds(containerRef.current.getBoundingClientRect());
    }

    const { left, top } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    smoothMouse.x.set(x);
    smoothMouse.y.set(y);
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    if (isStatic) return;
    setPosition(undefined);
  };

  const lensStyle = useMemo(
    () => ({
      position: "absolute" as const,
      width: `${lensSize}px`,
      height: `${lensSize}px`,
      backgroundColor: lensColor,
      borderRadius: "50%",
      pointerEvents: "none" as const,
      transform: "translate(-50%, -50%)",
      top: position?.y,
      left: position?.x,
      opacity: isVisible ? 1 : 0,
      transition: `opacity ${duration}s ease`,
      overflow: "hidden",
    }),
    [position, isVisible, lensSize, duration, lensColor],
  );

  const zoomedContentStyle = useMemo(() => {
    if (!position || !containerBounds) {
      return { display: "none" };
    }

    const left = lensSize / 2 - position.x * zoomFactor;
    const top = lensSize / 2 - position.y * zoomFactor;

    return {
      position: "absolute" as const,
      width: `${containerBounds.width}px`,
      height: `${containerBounds.height}px`,
      left: `${left}px`,
      top: `${top}px`,
      transform: `scale(${zoomFactor})`,
      transformOrigin: "0 0",
    };
  }, [position, containerBounds, zoomFactor, lensSize]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className ?? ""}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
      <motion.div style={lensStyle}>
        <div style={zoomedContentStyle}>{children}</div>
      </motion.div>
    </div>
  );
} 