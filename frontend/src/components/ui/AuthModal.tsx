"use client";

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X } from 'lucide-react';

// Reusing strength check if needed, or keeping it simple
function getStrength(pw: string) {
  if (!pw) return { score: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return { score };
}

export default function AuthModern({ isOpen, onClose, onLogin, initialMode = "login" }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setIsLogin(initialMode === "login");
  }, [isOpen, initialMode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && onClose) onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    let renderer: any;
    let geometry: any;
    let material: any;
    let scene: any;
    let camera: any;
    let animationId: number;

    const initThree = (THREE: any) => {
      if (!canvasRef.current || !active || isMobile) return;
      const canvas = canvasRef.current;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const uniforms = {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(window.innerWidth * 2, window.innerHeight * 2) },
        u_opacities: { value: [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0] },
        u_colors: { value: [
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1),
          new THREE.Vector3(1, 1, 1)
        ] },
        u_total_size: { value: 20.0 },
        u_dot_size: { value: 6.0 },
        u_reverse: { value: 0 }
      };

      material = new THREE.ShaderMaterial({
        vertexShader: `
          precision mediump float;
          uniform vec2 u_resolution;
          out vec2 fragCoord;
          void main() {
            gl_Position = vec4(position, 1.0);
            fragCoord = (position.xy + 1.0) * 0.5 * u_resolution;
            fragCoord.y = u_resolution.y - fragCoord.y;
          }
        `,
        fragmentShader: `
          precision mediump float;
          in vec2 fragCoord;

          uniform float u_time;
          uniform float u_opacities[10];
          uniform vec3 u_colors[6];
          uniform float u_total_size;
          uniform float u_dot_size;
          uniform vec2 u_resolution;
          uniform int u_reverse;

          out vec4 fragColor;

          float PHI = 1.61803398874989484820459;
          float random(vec2 xy) {
              return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
          }

          void main() {
              vec2 st = fragCoord.xy;
              st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
              st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

              float opacity = step(0.0, st.x) * step(0.0, st.y);

              vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

              float frequency = 5.0;
              float show_offset = random(st2);
              float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
              opacity *= u_opacities[int(rand * 10.0)];
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
              opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

              vec3 color = u_colors[int(show_offset * 6.0)];

              float animation_speed_factor = 3.0;
              vec2 center_grid = u_resolution / 2.0 / u_total_size;
              float dist_from_center = distance(center_grid, st2);

              float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

              float current_timing_offset = timing_offset_intro;
              opacity *= step(current_timing_offset, u_time * animation_speed_factor);
              opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);

              fragColor = vec4(color, opacity);
              fragColor.rgb *= fragColor.a;
          }
        `,
        uniforms: uniforms,
        glslVersion: THREE.GLSL3,
        blending: THREE.CustomBlending,
        blendSrc: THREE.SrcAlphaFactor,
        blendDst: THREE.OneFactor,
        transparent: true
      });

      geometry = new THREE.PlaneGeometry(2, 2);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const startTime = performance.now();
      const animate = () => {
        if (!active) return;
        animationId = requestAnimationFrame(animate);
        uniforms.u_time.value = (performance.now() - startTime) / 1000.0;
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth * 2, window.innerHeight * 2);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    if ((window as any).THREE) {
      const cleanUp = initThree((window as any).THREE);
      return () => {
        active = false;
        if (cleanUp) cleanUp();
        if (animationId) cancelAnimationFrame(animationId);
        if (renderer) renderer.dispose();
        if (geometry) geometry.dispose();
        if (material) material.dispose();
      };
    } else {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
      script.async = true;
      script.onload = () => {
        if ((window as any).THREE) {
          const cleanUp = initThree((window as any).THREE);
        }
      };
      document.head.appendChild(script);
    }

    return () => {
      active = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (geometry) geometry.dispose();
      if (material) material.dispose();
    };
  }, [isOpen]);

  async function handleGoogle() {
    try {
      setLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("invalid login credentials")) {
          setError("Invalid email or password.");
        } else {
          setError(error.message);
        }
        return;
      }
      if (onLogin) onLogin();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (getStrength(password).score < 2) {
      setError("Please choose a stronger password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/?verified=true" },
      });
      if (error) throw error;
      setSuccess("Welcome! Check your email to verify your account.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = isLogin ? handleLogin : handleSignup;

  async function handleOAuth(provider: any) {
    try {
      setLoading(true);
      setError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: { redirectTo: window.location.origin },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  /*  shared button styles  */
  const socialBtn: React.CSSProperties = {
    width:"100%", padding:"0.65rem", borderRadius:6,
    border:"1px solid #333", background:"transparent", color:"#fff",
    fontSize:"0.875rem", fontWeight:500, display:"flex", alignItems:"center", 
    justifyContent:"center", gap:"0.65rem", cursor:"pointer", transition:"all 0.2s"
  };

  const input: React.CSSProperties = {
    width:"100%", padding:"0.65rem 0.85rem", borderRadius:6,
    border:"1px solid #333", background:"#000", color:"#fff",
    fontSize:"0.875rem", outline:"none",
  };

  /*  Google / X / Discord / Apple SVGs  */
  const GoogleIcon = (
    <svg viewBox="0 0 24 24" style={{width:16,height:16,flexShrink:0}}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  const TwitterIcon = (
    <svg viewBox="0 0 24 24" style={{width:16,height:16,flexShrink:0}} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const DiscordIcon = (
    <svg viewBox="0 0 24 24" style={{width:16,height:16,flexShrink:0}} fill="currentColor">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
    </svg>
  );

  const AppleIcon = (
    <svg viewBox="0 0 24 24" style={{width:16,height:16,flexShrink:0}} fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09.101.146.21.285.32.416 1.058 1.512 2.302 3.208 4.021 3.178 1.636-.027 2.277-1.026 4.263-1.026 1.97 0 2.565 1.01 4.293 1.026 1.761.015 2.853-1.505 3.904-3.03.111-.161.219-.328.324-.499 1.187-1.741 1.674-3.419 1.696-3.513-.038-.016-3.298-1.265-3.327-5.02-.027-3.136 2.564-4.646 2.684-4.721-1.464-2.146-3.738-2.438-4.542-2.52-1.897-.22-3.837 1.065-4.846 1.065-.018-.002-.038-.002-.056-.002h-.002c-1.009 0-2.607-1.127-4.148-1.084v-.004zm2.846-5.467c-.015-.055-.03-.11-.051-.163-.122-.317-.306-.607-.542-.853-.591-.617-1.428-1.015-2.292-1.029-.02.046-.04.095-.059.143-.133.344-.199.723-.199 1.109 0 1.259.622 2.455 1.644 3.167.31.216.657.377 1.028.472.106.028.216.048.328.058 0-.012.001-.024.001-.036 0-1.127.469-2.181 1.285-2.946.046-.043.093-.085.143-.127v.006z"/>
    </svg>
  );

  const Logo = (
    <div style={{background:"var(--accent)",width:44,height:44,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"1.15rem",marginBottom:"0.75rem",border:"1px solid rgba(255,255,255,0.2)"}}>CN</div>
  );
  
  if (!isOpen) return null;

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:"#000",color:"#fff",fontFamily:"'Inter',-apple-system,sans-serif"}}>
      {/* WebGL Dot canvas or static background for mobile */}
      {!isMobile ? (
        <canvas ref={canvasRef} style={{position:"absolute",inset:0,zIndex:0}}/>
      ) : (
        <div style={{position:"absolute",inset:0,zIndex:0,background:"radial-gradient(circle at top right, rgba(99,102,241,0.1), transparent), radial-gradient(circle at bottom left, rgba(139,92,246,0.1), transparent), #000"}}/>
      )}

      {/* Vignette */}
      <div style={{position:"absolute",inset:0,zIndex:1,background:"radial-gradient(circle at center,rgba(0,0,0,0) 0%,rgba(0,0,0,0.85) 100%)",pointerEvents:"none"}}/>

      {/* Modal card */}
      <div style={{position:"relative",zIndex:2,background:"#121212",borderRadius:12,padding:"2rem",width:"100%",maxWidth:400,boxShadow:"0 10px 40px rgba(0,0,0,0.8)",display:"flex",flexDirection:"column",alignItems:"center",border:"1px solid #222"}}>
        
        {onClose && (
          <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"transparent",border:"none",color:"#666",cursor:"pointer"}}>
            <X size={20} />
          </button>
        )}

        {isLogin ? (
          <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
            {Logo}
            <h1 style={{fontSize:"1.35rem",fontWeight:600,marginBottom:"0.25rem",letterSpacing:"-0.025em"}}>Welcome Back</h1>
            <p style={{fontSize:"0.85rem",color:"#888",marginBottom:"0.85rem",lineHeight:1.5}}>Sign in to CryptoNeko.</p>

            <form onSubmit={handleSubmit} style={{width:"100%",display:"flex",flexDirection:"column",gap:"0.65rem"}}>
              <input style={input} type="email" placeholder="name@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
              <input style={input} type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
              <button disabled={loading} type="submit" style={{width:"100%",padding:"0.65rem",borderRadius:6,border:"none",background:"var(--accent)",color:"#fff",fontWeight:600,fontSize:"0.875rem",cursor:"pointer", opacity: loading ? 0.7 : 1}}>
                {loading ? "Signing In..." : "Continue with Email"}
              </button>
            </form>

            {error && <div style={{color:"var(--negative)",fontSize:"0.85rem",marginTop:"0.5rem"}}>{error}</div>}
            {success && <div style={{color:"var(--positive)",fontSize:"0.85rem",marginTop:"0.5rem"}}>{success}</div>}

            <div style={{height:1,background:"#222",width:"100%",margin:"0.85rem 0"}}/>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", width:"100%"}}>
              <button type="button" onClick={() => handleOAuth('google')} style={socialBtn}>{GoogleIcon}Google</button>
              <button type="button" onClick={() => handleOAuth('twitter')} style={socialBtn}>{TwitterIcon}X (Twitter)</button>
              <button type="button" onClick={() => handleOAuth('discord')} style={socialBtn}>{DiscordIcon}Discord</button>
              <button type="button" onClick={() => handleOAuth('apple')} style={socialBtn}>{AppleIcon}Apple</button>
            </div>

            <div style={{marginTop:"1.25rem",fontSize:"0.875rem",color:"#888"}}>
              Don't have an account?{" "}
              <button onClick={()=>{setIsLogin(false);setError("");setSuccess("");}} style={{color:"#fff",fontWeight:500,background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:"inherit",fontSize:"inherit"}}>Sign Up</button>
            </div>
          </div>
        ) : (
          <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
            {Logo}
            <h1 style={{fontSize:"1.35rem",fontWeight:600,marginBottom:"0.25rem",letterSpacing:"-0.025em"}}>Create an Account</h1>
            
            <form onSubmit={handleSubmit} style={{width:"100%",display:"flex",flexDirection:"column",gap:"0.65rem",marginTop:"1.25rem"}}>
              <input style={input} type="text" placeholder="Full Name" value={name} onChange={e=>setName(e.target.value)} required/>
              <input style={input} type="email" placeholder="name@email.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
              <input style={input} type="password" placeholder="Password (Min 8 chars)" value={password} onChange={e=>setPassword(e.target.value)} required/>
              <button disabled={loading} type="submit" style={{width:"100%",padding:"0.65rem",borderRadius:6,border:"none",background:"var(--accent)",color:"#fff",fontWeight:600,fontSize:"0.875rem",cursor:"pointer", opacity: loading ? 0.7 : 1}}>
                {loading ? "Creating..." : "Sign Up with Email"}
              </button>
            </form>

            {error && <div style={{color:"var(--negative)",fontSize:"0.85rem",marginTop:"0.5rem"}}>{error}</div>}

            <div style={{height:1,background:"#222",width:"100%",margin:"0.85rem 0"}}/>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem", width:"100%"}}>
              <button type="button" onClick={() => handleOAuth('google')} style={socialBtn}>{GoogleIcon}Google</button>
              <button type="button" onClick={() => handleOAuth('twitter')} style={socialBtn}>{TwitterIcon}X (Twitter)</button>
              <button type="button" onClick={() => handleOAuth('discord')} style={socialBtn}>{DiscordIcon}Discord</button>
              <button type="button" onClick={() => handleOAuth('apple')} style={socialBtn}>{AppleIcon}Apple</button>
            </div>

            <div style={{marginTop:"1.25rem",fontSize:"0.875rem",color:"#888"}}>
              Already have an account?{" "}
              <button onClick={()=>{setIsLogin(true);setError("");setSuccess("");}} style={{color:"#fff",fontWeight:500,background:"none",border:"none",padding:0,cursor:"pointer",fontFamily:"inherit",fontSize:"inherit"}}>Sign In</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
