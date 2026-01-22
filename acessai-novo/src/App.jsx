import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Locate, Trash2, LogOut, Map as MapIcon, History, Info, 
  ArrowLeft, Navigation, CheckCircle, Menu, X, Star, Users, MapPin, Mail, Eye, Shield, FileText 
} from 'lucide-react';
import L from 'leaflet';

// --- IMPORT DA IMAGEM (AQUI ESTÁ A MÁGICA 📸) ---
// Certifique-se de que sua imagem se chama 'print.png' e está na pasta src
import printApp from './print.png'; 

// --- FIREBASE IMPORTS ---
import { db } from './firebaseConfig'; 
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

// --- CONFIGURAÇÃO ---
const opcoesDeficiencia = {
  motora: { titulo: "Mobilidade", emojiCategoria: "♿", problemas: [{ id: 'rampa', nome: 'Falta de Rampa', emoji: '↘️' }, { id: 'calcada', nome: 'Calçada Irregular', emoji: '🚧' }] },
  visual: { titulo: "Visual", emojiCategoria: "👁️", problemas: [{ id: 'piso', nome: 'Sem Piso Tátil', emoji: '🟦' }, { id: 'obstaculo', nome: 'Objeto Suspenso', emoji: '⚠️' }] },
  auditiva: { titulo: "Auditiva", emojiCategoria: "👂", problemas: [{ id: 'aviso', nome: 'Sem Aviso Visual', emoji: '👀' }] },
  cognitiva: { titulo: "Intelectual", emojiCategoria: "🧠", problemas: [{ id: 'sinalizacao', nome: 'Sinalização Confusa', emoji: '❓' }] }
};

const coresAvaliacao = { boa: '#2ecc71', media: '#f1c40f', ruim: '#e74c3c' };

const criarIcone = (emoji, avaliacao) => {
  const cor = coresAvaliacao[avaliacao] || '#95a5a6';
  return L.divIcon({
    html: `<div style="background-color: ${cor}; color: white; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

// --- ESTILO GLOBAL PARA ACESSIBILIDADE (Foco visível) ---
const GlobalAccessibilityStyles = () => (
  <style>{`
    *:focus-visible {
      outline: 4px solid #e67e22 !important; /* Laranja forte para destaque no TAB */
      outline-offset: 4px;
    }
    /* Aumentar contraste de seleção de texto */
    ::selection {
      background-color: #0056b3;
      color: white;
    }
  `}</style>
);

// --- TELA 1: LANDING PAGE (COM FOTO REAL E ACESSIBILIDADE) ---
function TelaLanding() {
  const logarComGoogle = async () => { try { await signInWithPopup(auth, provider); } catch (error) { alert("Erro: " + error.message); } };

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#000', overflowX: 'hidden', lineHeight: 1.6, backgroundColor: '#fff' }}>
      <GlobalAccessibilityStyles />
      
      {/* 1. NAVBAR DE ALTO CONTRASTE */}
      <nav aria-label="Menu Principal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', background: '#fff', borderBottom: '3px solid #000', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: '#000', padding: '10px', borderRadius: '8px', color: '#fff' }} aria-hidden="true">
            <span style={{ fontSize: '28px' }}>♿</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '900', color: '#000', letterSpacing: '-0.5px' }}>AcessaAí</h1>
        </div>
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }} className="desktop-menu">
          <a href="#como-funciona" style={{ textDecoration: 'none', color: '#000', fontWeight: '700', fontSize: '1.2rem', padding: '10px' }}>Como Funciona</a>
          <button onClick={logarComGoogle} aria-label="Acessar conta com Google" style={{ padding: '14px 28px', background: '#0056b3', color: 'white', border: '3px solid #000', borderRadius: '50px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', transition: '0.2s' }}>
            Acessar / Cadastrar
          </button>
        </div>
      </nav>

      {/* 2. HERÓI (IMAGEM REAL AQUI 👇) */}
      <header role="banner" style={{ padding: '80px 5%', textAlign: 'center', background: '#f4f4f4' }}>
        <h2 style={{ fontSize: '3rem', marginBottom: '25px', lineHeight: 1.1, color: '#000', fontWeight: '900' }}>
          Encontre e avalie a acessibilidade<br/>da sua cidade.
        </h2>
        <p style={{ fontSize: '1.4rem', color: '#222', maxWidth: '750px', margin: '0 auto 40px', fontWeight: '500' }}>
          Navegue por um mapa colaborativo em tempo real. Compartilhe rotas seguras e avalie locais.<br/>
          <strong>Sua mobilidade é a nossa prioridade.</strong>
        </p>
        
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '60px', flexWrap: 'wrap' }}>
          <button onClick={logarComGoogle} style={{ padding: '18px 36px', background: '#000', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '1.3rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 5px 0px rgba(0,0,0,0.5)' }}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden="true" style={{width: 28, height: 28, background: 'white', borderRadius: '50%', padding: 2}}/>
            Acessar com Google
          </button>
          <a href="#como-funciona" style={{ padding: '18px 36px', background: '#fff', color: '#000', border: '3px solid #000', borderRadius: '50px', fontSize: '1.3rem', fontWeight: 'bold', textDecoration: 'none', cursor: 'pointer' }}>
            Saiba Mais
          </a>
        </div>
        
        {/* EXIBIÇÃO DA IMAGEM REAL */}
        <div style={{ maxWidth: '900px', margin: '0 auto', border: '3px solid #000', borderRadius: '15px', overflow: 'hidden', boxShadow: '10px 10px 0px rgba(0,0,0,0.2)' }}>
            {/* Se o print.png estiver na pasta src, ele vai aparecer aqui */}
            <img 
              src={printApp} 
              alt="Captura de tela do aplicativo AcessaAí mostrando o mapa da cidade com pinos coloridos indicando locais acessíveis e barreiras urbanas." 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
        </div>
      </header>

      {/* 3. COMO FUNCIONA (ÍCONES GRANDES) */}
      <section id="como-funciona" aria-labelledby="titulo-como-funciona" style={{ padding: '80px 5%', background: 'white' }}>
        <h3 id="titulo-como-funciona" style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '60px', color: '#000', fontWeight: '800' }}>Como Funciona?</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px', maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '15px', border: '3px solid #000' }}>
            <div style={{ width: 80, height: 80, background: '#0056b3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', border: '3px solid #000' }} aria-hidden="true"><MapIcon size={40}/></div>
            <h4 style={{fontSize: '1.5rem', marginBottom: '10px', color: '#000', fontWeight:'800'}}>1. Visualize o Mapa</h4>
            <p style={{color: '#000', fontSize: '1.2rem'}}>Identifique barreiras e locais acessíveis com ícones de alto contraste.</p>
          </div>

          <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '15px', border: '3px solid #000' }}>
            <div style={{ width: 80, height: 80, background: '#d35400', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', border: '3px solid #000' }} aria-hidden="true"><Star size={40}/></div>
            <h4 style={{fontSize: '1.5rem', marginBottom: '10px', color: '#000', fontWeight:'800'}}>2. Avalie Locais</h4>
            <p style={{color: '#000', fontSize: '1.2rem'}}>Classifique usando cores universais: Verde (Bom), Amarelo (Médio) ou Vermelho (Ruim).</p>
          </div>

          <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '15px', border: '3px solid #000' }}>
            <div style={{ width: 80, height: 80, background: '#27ae60', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'white', border: '3px solid #000' }} aria-hidden="true"><Users size={40}/></div>
            <h4 style={{fontSize: '1.5rem', marginBottom: '10px', color: '#000', fontWeight:'800'}}>3. Colabore</h4>
            <p style={{color: '#000', fontSize: '1.2rem'}}>Deixe comentários e ajude a traçar rotas seguras para todos.</p>
          </div>
          
        </div>
      </section>

      {/* 4. RODAPÉ (LINKS LEGAIS) */}
      <footer role="contentinfo" style={{ background: '#000', color: 'white', padding: '60px 5%', textAlign: 'center', borderTop: '5px solid #0056b3' }}>
        <div style={{ marginBottom: '30px' }}>
            <h4 style={{margin: '0 0 10px 0', fontSize: '1.8rem', color: '#fff', fontWeight:'900'}}>AcessaAí ♿</h4>
            <p style={{color: '#ddd', fontSize: '1.2rem'}}>Mapeando a acessibilidade com você.</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '40px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}><Mail size={24}/> contato@acessaai.com</span>
        </div>

        {/* Links Legais e Acessibilidade */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', fontSize: '1.2rem' }}>
            <a href="#" style={{ color: '#8ecae6', textDecoration: 'underline', padding: '10px' }} aria-label="Ler Termos de Uso"><FileText size={20} style={{marginRight: 8, verticalAlign: 'middle'}}/>Termos de Uso</a>
            <span style={{color: '#555'}} aria-hidden="true">|</span>
            <a href="#" style={{ color: '#8ecae6', textDecoration: 'underline', padding: '10px' }} aria-label="Ler Política de Privacidade"><Shield size={20} style={{marginRight: 8, verticalAlign: 'middle'}}/>Política de Privacidade</a>
            <span style={{color: '#555'}} aria-hidden="true">|</span>
            <a href="#" style={{ color: '#ffb703', textDecoration: 'underline', fontWeight: 'bold', padding: '10px', background: '#000', border: '2px solid #ffb703', borderRadius: '8px' }} aria-label="Página de Acessibilidade Digital"><Eye size={20} style={{marginRight: 8, verticalAlign: 'middle'}}/>Acessibilidade Digital</a>
        </div>

        <div style={{ borderTop: '1px solid #333', marginTop: '40px', paddingTop: '20px', fontSize: '1rem', color: '#aaa' }}>
            &copy; 2026 AcessaAí. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

// --- TELA 2: MENU (MANTIDA COM PEQUENOS AJUSTES DE CONTRASTE) ---
function TelaInicial({ user }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <GlobalAccessibilityStyles />
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
           <h2>Olá, {user.displayName?.split(' ')[0]}!</h2>
           <small style={{color: '#333', fontSize: '1.1rem', fontWeight: '500'}}>Vamos mapear hoje?</small>
        </div>
        <button onClick={() => signOut(auth)} style={{ border: '2px solid #c0392b', background: 'white', color: '#c0392b', padding: '8px', borderRadius: '50%' }} title="Sair da conta"><LogOut /></button>
      </header>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        <div onClick={() => navigate('/mapa')} role="button" tabIndex="0" style={{ background: 'linear-gradient(135deg, #004494, #003366)', color: 'white', padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', border: '2px solid #000' }}>
          <MapIcon size={32} /> <div><h3 style={{margin:0, fontSize: '1.4rem'}}>Abrir Mapa</h3><small style={{fontSize: '1rem'}}>Navegar e Reportar</small></div>
        </div>
        
        <div onClick={() => navigate('/historico')} role="button" tabIndex="0" style={{ background: '#fff', border: '3px solid #000', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{background: '#f1c40f', padding: 10, borderRadius: 10, color: 'black', border: '2px solid #000'}}><History size={24}/></div>
          <h3 style={{margin:0, color: '#000'}}>Minhas Contribuições</h3>
        </div>

        <div onClick={() => navigate('/tutorial')} role="button" tabIndex="0" style={{ background: '#fff', border: '3px solid #000', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{background: '#7f8c8d', padding: 10, borderRadius: 10, color: 'white', border: '2px solid #000'}}><Info size={24}/></div>
          <div><h3 style={{margin:0, color: '#000'}}>Como funciona?</h3><small style={{color: '#333', fontWeight:'bold'}}>Aprenda a usar</small></div>
        </div>
      </div>
    </div>
  );
}

// --- TELA: TUTORIAL ---
function TelaTutorial() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <GlobalAccessibilityStyles />
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '18px', marginBottom: '20px', cursor: 'pointer', color: '#0056b3', fontWeight: 'bold' }}><ArrowLeft /> Voltar</button>
      <h2 style={{color: '#000', fontSize: '2rem'}}>Como usar o AcessaAí 💡</h2>
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '10px', border: '2px solid #000' }}>
          <div style={{ background: '#0056b3', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0, border: '2px solid #000' }}>1</div>
          <div><strong style={{fontSize: '1.2rem', color: '#000'}}>Abra o Mapa:</strong><br/><span style={{fontSize:'1.1rem', color:'#333'}}>Clique no botão azul para ver a cidade.</span></div>
        </div>
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '10px', border: '2px solid #000' }}>
          <div style={{ background: '#27ae60', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0, border: '2px solid #000' }}>2</div>
          <div><strong style={{fontSize: '1.2rem', color: '#000'}}>Avalie:</strong><br/><span style={{fontSize:'1.1rem', color:'#333'}}>Clique no local, escolha a cor e comente.</span></div>
        </div>
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '10px', border: '2px solid #000' }}>
          <div style={{ background: '#f1c40f', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', flexShrink: 0, border: '2px solid #000' }}>3</div>
          <div><strong style={{fontSize: '1.2rem', color: '#000'}}>Rotas:</strong><br/><span style={{fontSize:'1.1rem', color:'#333'}}>Use o botão <Navigation size={14} style={{display:'inline'}}/> para traçar o caminho.</span></div>
        </div>
      </div>
    </div>
  );
}

// --- TELA 3: MAPA (MANTIDA) ---
function TelaMapa() {
  const [pontos, setPontos] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [pontoTemporario, setPontoTemporario] = useState(null);
  const [rota, setRota] = useState(null);
  const [categoriaAtiva, setCategoriaAtiva] = useState('motora');
  const [problemaAtivo, setProblemaAtivo] = useState(opcoesDeficiencia['motora'].problemas[0]);
  const [avaliacao, setAvaliacao] = useState('media');
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "pontos"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPontos(snapshot.docs.map(doc => ({ id_firebase: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  function ControladorDeCliques() {
    useMapEvents({ click(e) { setPontoTemporario(e.latlng); setModalAberto(true); setComentario(''); setAvaliacao('media'); } });
    return null;
  }

  const salvarPonto = async () => {
    if (!pontoTemporario) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, "pontos"), {
        lat: pontoTemporario.lat, lng: pontoTemporario.lng, texto: problemaAtivo.nome, emoji: problemaAtivo.emoji,
        categoria: opcoesDeficiencia[categoriaAtiva].titulo, avaliacao: avaliacao, comentario: comentario,
        userId: auth.currentUser.uid, userName: auth.currentUser.displayName, data: new Date().toISOString()
      });
      setModalAberto(false); setPontoTemporario(null);
    } catch (e) { alert("Erro ao salvar: " + e.message); }
    setEnviando(false);
  };

  const tracarRota = (destino) => {
    if (!navigator.geolocation) return alert("Preciso da sua localização!");
    navigator.geolocation.getCurrentPosition((pos) => { 
        setRota([[pos.coords.latitude, pos.coords.longitude], [destino.lat, destino.lng]]); 
        alert("Rota traçada! Siga a linha azul pontilhada.");
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GlobalAccessibilityStyles />
      <div style={{ padding: '15px', background: '#000', color: 'white', display: 'flex', justifyContent: 'space-between', zIndex: 1000, borderBottom: '3px solid #0056b3' }}>
        <button onClick={() => navigate('/')} style={{ background: 'white', border: '2px solid #000', color: '#000', display: 'flex', alignItems: 'center', gap: 5, fontSize: '1rem', padding: '5px 10px', borderRadius: '5px', fontWeight: 'bold' }}><ArrowLeft /> Voltar</button>
        <strong style={{fontSize: '1.2rem'}}>Mapa AcessaAí</strong>
        <div style={{ width: 24 }}></div>
      </div>

      <MapContainer center={[-5.915, -35.263]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        <ControladorDeCliques />
        {rota && <Polyline positions={rota} color="#0056b3" dashArray="10, 10" weight={6} />}
        
        {pontos.map(p => (
          <Marker key={p.id_firebase} position={[p.lat, p.lng]} icon={criarIcone(p.emoji, p.avaliacao)}>
            <Popup>
              <div style={{ width: '200px', fontSize: '1.1rem' }}>
                <strong style={{ color: coresAvaliacao[p.avaliacao] }}>{p.emoji} {p.texto}</strong>
                <p style={{ margin: '5px 0', fontSize: '1rem', color: '#000' }}>"{p.comentario || 'Sem comentários'}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                   <small>Por: {p.userName?.split(' ')[0]}</small>
                   <div style={{ display: 'flex', gap: '5px' }}>
                     <button onClick={() => tracarRota(p)} title="Traçar rota até aqui" style={{ background: '#0056b3', color: 'white', border: '2px solid #000', borderRadius: '5px', padding: '8px', cursor: 'pointer' }}><Navigation size={20}/></button>
                     {auth.currentUser.uid === p.userId && (
                       <button onClick={() => deleteDoc(doc(db, "pontos", p.id_firebase))} style={{ background: '#d35400', color: 'white', border: '2px solid #000', borderRadius: '5px', padding: '8px' }}><Trash2 size={20}/></button>
                     )}
                   </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {modalAberto && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', padding: '20px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 9999, boxShadow: '0 -5px 20px rgba(0,0,0,0.5)', maxHeight: '80vh', overflowY: 'auto', borderTop: '5px solid #000' }}>
          <h3 style={{fontSize: '1.8rem', color: '#000', fontWeight:'900'}}>Novo Reporte 📍</h3>
          
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px' }}>
            {Object.entries(opcoesDeficiencia).map(([key, val]) => (
              <button key={key} onClick={() => { setCategoriaAtiva(key); setProblemaAtivo(val.problemas[0]); }} style={{ padding: '12px 20px', borderRadius: '30px', border: categoriaAtiva === key ? '3px solid #000' : '2px solid #777', background: categoriaAtiva === key ? '#0056b3' : 'white', color: categoriaAtiva === key ? 'white' : 'black', whiteSpace: 'nowrap', fontSize: '1.1rem', fontWeight: 'bold' }}>{val.emojiCategoria} {val.titulo}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {opcoesDeficiencia[categoriaAtiva].problemas.map(prob => (
              <button key={prob.id} onClick={() => setProblemaAtivo(prob)} style={{ padding: '12px', borderRadius: '10px', background: problemaAtivo.id === prob.id ? '#d4e6f1' : '#fff', border: '2px solid #000', fontSize: '1rem', fontWeight: problemaAtivo.id === prob.id ? 'bold' : 'normal' }}>{prob.emoji} {prob.nome}</button>
            ))}
          </div>

          <div style={{ marginTop: '20px' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1.2rem' }}>Nível de Acessibilidade:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button onClick={() => setAvaliacao('boa')} style={{ flex: 1, padding: '15px', background: avaliacao === 'boa' ? coresAvaliacao.boa : '#fff', color: avaliacao === 'boa' ? 'white' : 'black', border: '2px solid #000', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Boa 😄</button>
              <button onClick={() => setAvaliacao('media')} style={{ flex: 1, padding: '15px', background: avaliacao === 'media' ? coresAvaliacao.media : '#fff', color: avaliacao === 'media' ? 'white' : 'black', border: '2px solid #000', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Média 😐</button>
              <button onClick={() => setAvaliacao('ruim')} style={{ flex: 1, padding: '15px', background: avaliacao === 'ruim' ? coresAvaliacao.ruim : '#fff', color: avaliacao === 'ruim' ? 'white' : 'black', border: '2px solid #000', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Péssima 😡</button>
            </div>
          </div>
          
          <textarea placeholder="Deixe um comentário..." value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '10px', border: '2px solid #000', fontSize: '1.1rem' }} rows={3} />
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
            <button onClick={() => setModalAberto(false)} style={{ flex: 1, padding: '15px', background: '#ccc', color: '#000', border: '2px solid #000', borderRadius: '10px', fontSize: '1.2rem', fontWeight: 'bold' }}>Cancelar</button>
            <button onClick={salvarPonto} disabled={enviando} style={{ flex: 1, padding: '15px', background: '#0056b3', color: 'white', border: '2px solid #000', borderRadius: '10px', fontWeight: 'bold', fontSize: '1.2rem' }}>{enviando ? 'Enviando...' : 'Publicar 📢'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TelaHistorico() { return <div style={{padding: 20}}><h2>Histórico em breve...</h2></div> }

export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, setUser); return unsubscribe; }, []);
  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <TelaInicial user={user} /> : <TelaLanding />} />
        <Route path="/mapa" element={user ? <TelaMapa /> : <TelaLanding />} />
        <Route path="/historico" element={user ? <TelaHistorico /> : <TelaLanding />} />
        <Route path="/tutorial" element={user ? <TelaTutorial /> : <TelaLanding />} />
      </Routes>
    </Router>
  );
}