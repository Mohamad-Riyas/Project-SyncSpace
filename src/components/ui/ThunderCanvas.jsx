import { jsx as _jsx } from "react/jsx-runtime";
import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
export const ThunderCanvas = () => {
    const canvasRef = useRef(null);
    const { theme } = useTheme();
    const getThemePalette = () => {
        switch (theme) {
            case 'violet':
                return {
                    particles: ['#a855f7', '#c084fc', '#ec4899', '#f472b6', '#8b5cf6'],
                    glowPrimary: 'rgba(168, 85, 247, 0.25)',
                    glowAccent: 'rgba(236, 72, 153, 0.12)',
                    bolt1: '#c084fc',
                    bolt2: '#f472b6',
                };
            case 'emerald':
                return {
                    particles: ['#10b981', '#34d399', '#14b8a6', '#2dd4bf', '#059669'],
                    glowPrimary: 'rgba(16, 185, 129, 0.25)',
                    glowAccent: 'rgba(20, 184, 166, 0.12)',
                    bolt1: '#34d399',
                    bolt2: '#2dd4bf',
                };
            case 'amber':
                return {
                    particles: ['#f59e0b', '#fbbf24', '#f97316', '#fb923c', '#d97706'],
                    glowPrimary: 'rgba(245, 158, 11, 0.25)',
                    glowAccent: 'rgba(249, 115, 22, 0.12)',
                    bolt1: '#fbbf24',
                    bolt2: '#fb923c',
                };
            case 'light':
                return {
                    particles: ['#6366f1', '#818cf8', '#06b6d4', '#38bdf8', '#4f46e5'],
                    glowPrimary: 'rgba(99, 102, 241, 0.15)',
                    glowAccent: 'rgba(6, 182, 212, 0.08)',
                    bolt1: '#818cf8',
                    bolt2: '#38bdf8',
                };
            case 'cyan':
            default:
                return {
                    particles: ['#06b6d4', '#22d3ee', '#8b5cf6', '#a855f7', '#60a5fa'],
                    glowPrimary: 'rgba(6, 182, 212, 0.25)',
                    glowAccent: 'rgba(139, 92, 246, 0.12)',
                    bolt1: '#22d3ee',
                    bolt2: '#a855f7',
                };
        }
    };
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        let animationFrameId;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);
        const palette = getThemePalette();
        const handleResize = () => {
            if (!canvas)
                return;
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);
        // Particle Setup (Electric Sparks)
        const particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.8,
                vy: (Math.random() - 0.5) * 0.8,
                radius: Math.random() * 2 + 1,
                alpha: Math.random() * 0.7 + 0.3,
                color: palette.particles[Math.floor(Math.random() * palette.particles.length)],
            });
        }
        // Lightning Bolts Array
        let bolts = [];
        const createLightning = (startX, startY, targetX, targetY) => {
            const path = [{ x: startX, y: startY }];
            const steps = 12;
            for (let i = 0; i < steps; i++) {
                const progress = (i + 1) / steps;
                const nextX = startX + (targetX - startX) * progress + (Math.random() - 0.5) * 40;
                const nextY = startY + (targetY - startY) * progress + (Math.random() - 0.5) * 40;
                path.push({ x: nextX, y: nextY });
            }
            return {
                path,
                alpha: 1.0,
                width: Math.random() * 2.5 + 1,
                color: Math.random() > 0.5 ? palette.bolt1 : palette.bolt2,
            };
        };
        let lastBoltTime = 0;
        const render = (time) => {
            ctx.clearRect(0, 0, width, height);
            // 1. Render Radiating Electric Ambient Rings (Center Pulse)
            const centerX = width * 0.5;
            const centerY = height * 0.3;
            const pulseRadius = (Math.sin(time * 0.002) + 1) * 80 + 120;
            const radialGlow = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, pulseRadius * 2);
            radialGlow.addColorStop(0, palette.glowPrimary);
            radialGlow.addColorStop(0.5, palette.glowAccent);
            radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = radialGlow;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseRadius * 2, 0, Math.PI * 2);
            ctx.fill();
            // 2. Spawn Occasional Lightning Arc Striking from Radiating Center
            if (time - lastBoltTime > 1800 + Math.random() * 2500) {
                lastBoltTime = time;
                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * 250 + 150;
                bolts.push(createLightning(centerX, centerY, centerX + Math.cos(angle) * dist, centerY + Math.sin(angle) * dist));
            }
            // Render Lightning Bolts
            for (let i = bolts.length - 1; i >= 0; i--) {
                const bolt = bolts[i];
                ctx.beginPath();
                ctx.strokeStyle = bolt.color;
                ctx.lineWidth = bolt.width;
                ctx.globalAlpha = bolt.alpha;
                ctx.shadowColor = bolt.color;
                ctx.shadowBlur = 15;
                for (let j = 0; j < bolt.path.length - 1; j++) {
                    ctx.moveTo(bolt.path[j].x, bolt.path[j].y);
                    ctx.lineTo(bolt.path[j + 1].x, bolt.path[j + 1].y);
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
                bolt.alpha -= 0.04;
                if (bolt.alpha <= 0) {
                    bolts.splice(i, 1);
                }
            }
            ctx.globalAlpha = 1.0;
            // 3. Render Sparks (Particles)
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0)
                    p.x = width;
                if (p.x > width)
                    p.x = 0;
                if (p.y < 0)
                    p.y = height;
                if (p.y > height)
                    p.y = 0;
                ctx.fillStyle = p.color;
                ctx.globalAlpha = p.alpha;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            ctx.globalAlpha = 1.0;
            animationFrameId = requestAnimationFrame(render);
        };
        animationFrameId = requestAnimationFrame(render);
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);
    return (_jsx("canvas", { ref: canvasRef, className: "fixed inset-0 pointer-events-none z-0 opacity-80 transition-opacity duration-300" }));
};
