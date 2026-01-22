import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Locate, Trash2, LogOut, Map as MapIcon, History, Info, 
  ArrowLeft, Navigation, CheckCircle, Menu, X, Star, Users, MapPin, Mail, Eye, Shield, FileText 
} from 'lucide-react';
import L from 'leaflet';

// --- IMPORT DA IMAGEM ---
import printApp from './assets/print.png'; 

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

// AJUSTE 1: Ícones do mapa menores (35px - Tamanho Padrão)
const criarIcone = (emoji, avaliacao) => {
  const cor = coresAvaliacao[avaliacao] || '#95a5a6';
  return L.divIcon({
    html: `<div style="background-color: ${cor}; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  });
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

// --- ESTILO GLOBAL PARA ACESSIBILIDADE ---
const GlobalAccessibilityStyles = () => (
  <style>{`
    *:focus-visible {
      outline: 3px solid #e67e22 !important;
      outline-offset: 2px;
    }
    ::selection {
      background-color: #3498db;
      color: white;
    }
  `}</style>
);

// --- TELA 1: LANDING PAGE ---
function TelaLanding() {
  const logarComGoogle = async () => { try { await signInWithPopup(auth, provider); } catch (error) { alert("Erro: " + error.message); } };

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#2c3e50', overflowX: 'hidden', lineHeight: 1.6, backgroundColor: '#fdfbfb' }}>
      <GlobalAccessibilityStyles />
      
      {/* NAVBAR */}
      <nav aria-label="Menu Principal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#3498db', padding: '8px', borderRadius: '8px', color: 'white' }} aria-hidden="true">
            <span style={{ fontSize: '24px' }}>♿</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '800', color: '#2c3e50', letterSpacing: '-0.5px' }}>AcessaAí</h1>
        </div>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }} className="desktop-menu">
          <a href="#como-funciona" style={{ textDecoration: 'none', color: '#7f8c8d', fontWeight: '600', fontSize: '1rem', padding: '5px' }}>Como Funciona</a>
          <button onClick={logarComGoogle} aria-label="Acessar conta com Google" style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: '0.3s', boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)' }}>
            Acessar / Cadastrar
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header role="banner" style={{ padding: '50px 5%', textAlign: 'center', background: 'linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%)' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', lineHeight: 1.1, color: '#2c3e50', fontWeight: '800' }}>
          Encontre e avalie a acessibilidade<br/>da sua cidade.
        </h2>
        <p style={{ fontSize: '1.2rem', color: '#7f8c8d', maxWidth: '750px', margin: '0 auto 30px', fontWeight: '500' }}>
          Navegue por um mapa colaborativo em tempo real. Compartilhe rotas seguras e avalie locais.<br/>
          <strong style={{color: '#3498db'}}>Sua mobilidade é a nossa prioridade.</strong>
        </p>
        
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          <button onClick={logarComGoogle} style={{ padding: '15px 30px', background: '#2c3e50', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 6px 15px rgba(44, 62, 80, 0.3)' }}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" aria-hidden="true" style={{width: 24, height: 24, background: 'white', borderRadius: '50%', padding: 2}}/>
            Acessar com Google
          </button>
          <a href="#como-funciona" style={{ padding: '15px 30px', background: 'white', color: '#2c3e50', border: '2px solid #bdc3c7', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none', cursor: 'pointer' }}>
            Saiba Mais
          </a>
        </div>
        
        {/* IMAGEM DO APP */}
        <div style={{ maxWidth: '900px', margin: '0 auto', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <img 
              src={printApp} 
              alt="Captura de tela do aplicativo AcessaAí mostrando o mapa da cidade com pinos coloridos indicando locais acessíveis e barreiras urbanas." 
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
        </div>
      </header>

      {/* COMO FUNCIONA - AJUSTE 2: Ícones menores */}
      <section id="como-funciona" aria-labelledby="titulo-como-funciona" style={{ padding: '60px 5%', background: 'white' }}>
        <h3 id="titulo-como-funciona" style={{ textAlign: 'center', fontSize: '2.2rem', marginBottom: '50px', color: '#2c3e50', fontWeight: '800' }}>Como Funciona?</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f2f6' }}>
            <div style={{ width: 60, height: 60, background: '#e8f4f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#3498db' }} aria-hidden="true"><MapIcon size={30}/></div>
            <h4 style={{fontSize: '1.3rem', marginBottom: '10px', color: '#2c3e50', fontWeight:'700'}}>1. Visualize o Mapa</h4>
            <p style={{color: '#7f8c8d', fontSize: '1rem'}}>Identifique barreiras e locais acessíveis com ícones claros no mapa.</p>
          </div>

          <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f2f6' }}>
            <div style={{ width: 60, height: 60, background: '#fff9c4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#fbc02d' }} aria-hidden="true"><Star size={30}/></div>
            <h4 style={{fontSize: '1.3rem', marginBottom: '10px', color: '#2c3e50', fontWeight:'700'}}>2. Avalie Locais</h4>
            <p style={{color: '#7f8c8d', fontSize: '1rem'}}>Classifique usando cores: Verde (Bom), Amarelo (Médio) ou Vermelho (Ruim).</p>
          </div>

          <div style={{ textAlign: 'center', padding: '30px', background: '#fff', borderRadius: '20px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f2f6' }}>
            <div style={{ width: 60, height: 60, background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#2ecc71' }} aria-hidden="true"><Users size={30}/></div>
            <h4 style={{fontSize: '1.3rem', marginBottom: '10px', color: '#2c3e50', fontWeight:'700'}}>3. Colabore</h4>
            <p style={{color: '#7f8c8d', fontSize: '1rem'}}>Deixe comentários e ajude a traçar rotas seguras para todos.</p>
          </div>
          
        </div>
      </section>

      {/* RODAPÉ */}
      <footer role="contentinfo" style={{ background: '#2c3e50', color: 'white', padding: '50px 5%', textAlign: 'center' }}>
        <div style={{ marginBottom: '30px' }}>
            <h4 style={{margin: '0 0 10px 0', fontSize: '1.5rem', color: '#fff', fontWeight:'900'}}>AcessaAí ♿</h4>
            <p style={{color: '#bdc3c7', fontSize: '1rem'}}>Mapeando a acessibilidade com você.</p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ecf0f1', fontSize: '1rem', fontWeight: '500' }}><Mail size={20}/> contato@acessaai.com</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap', fontSize: '1rem' }}>
            <a href="#" style={{ color: '#bdc3c7', textDecoration: 'none', padding: '5px' }} aria-label="Ler Termos de Uso">Termos de Uso</a>
            <span style={{color: '#7f8c8d'}} aria-hidden="true">|</span>
            <a href="#" style={{ color: '#bdc3c7', textDecoration: 'none', padding: '5px' }} aria-label="Ler Política de Privacidade">Política de Privacidade</a>
            <span style={{color: '#7f8c8d'}} aria-hidden="true">|</span>
            <a href="#" style={{ color: '#f1c40f', textDecoration: 'underline', fontWeight: 'bold', padding: '5px' }} aria-label="Página de Acessibilidade Digital"><Eye size={18} style={{marginRight: 8, verticalAlign: 'middle'}}/>Acessibilidade Digital</a>
        </div>

        <div style={{ borderTop: '1px solid #34495e', marginTop: '40px', paddingTop: '20px', fontSize: '0.9rem', color: '#95a5a6' }}>
            &copy; 2026 AcessaAí. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

// --- TELA 2: MENU (AJUSTE 3: Ícones menores) ---
function TelaInicial({ user }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <GlobalAccessibilityStyles />
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
           <h2>Olá, {user.displayName?.split(' ')[0]}!</h2>
           <small style={{color: '#7f8c8d', fontSize: '1rem', fontWeight: '500'}}>Vamos mapear hoje?</small>
        </div>
        <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', color: '#c0392b' }} title="Sair da conta"><LogOut size={24}/></button>
      </header>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        <div onClick={() => navigate('/mapa')} role="button" tabIndex="0" style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(52, 152, 219, 0.3)' }}>
          <MapIcon size={30} /> <div><h3 style={{margin:0, fontSize: '1.3rem'}}>Abrir Mapa</h3><small style={{fontSize: '1rem', opacity: 0.9}}>Navegar e Reportar</small></div>
        </div>
        
        <div onClick={() => navigate('/historico')} role="button" tabIndex="0" style={{ background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
          <div style={{background: '#f1c40f', padding: 10, borderRadius: 10, color: 'white'}}><History size={24}/></div>
          <h3 style={{margin:0, color: '#2c3e50', fontSize: '1.2rem'}}>Minhas Contribuições</h3>
        </div>

        <div onClick={() => navigate('/tutorial')} role="button" tabIndex="0" style={{ background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' }}>
          <div style={{background: '#95a5a6', padding: 10, borderRadius: 10, color: 'white'}}><Info size={24}/></div>
          <div><h3 style={{margin:0, color: '#2c3e50', fontSize: '1.2rem'}}>Como funciona?</h3><small style={{color: '#7f8c8d', fontSize: '0.9rem'}}>Aprenda a usar</small></div>
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
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '18px', marginBottom: '20px', cursor: 'pointer', color: '#3498db', fontWeight: 'bold' }}><ArrowLeft /> Voltar</button>
      <h2 style={{color: '#2c3e50', fontSize: '1.8rem'}}>Como usar o AcessaAí 💡</h2>
      <div style={{ display: 'grid', gap: '15px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#3498db', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0, fontSize: '1.1rem' }}>1</div>
          <div><strong style={{fontSize: '1.1rem', color: '#2c3e50'}}>Abra o Mapa:</strong><br/><span style={{fontSize:'1rem', color:'#7f8c8d'}}>Clique no botão azul para ver a cidade.</span></div>
        </div>
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#2ecc71', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0, fontSize: '1.1rem' }}>2</div>
          <div><strong style={{fontSize: '1.1rem', color: '#2c3e50'}}>Avalie:</strong><br/><span style={{fontSize:'1rem', color:'#7f8c8d'}}>Clique no local, escolha a cor e comente.</span></div>
        </div>
        <div style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <div style={{ background: '#f1c40f', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', flexShrink: 0, fontSize: '1.1rem' }}>3</div>
          <div><strong style={{fontSize: '1.1rem', color: '#2c3e50'}}>Rotas:</strong><br/><span style={{fontSize:'1rem', color:'#7f8c8d'}}>Use o botão <Navigation size={14} style={{display:'inline'}}/> para traçar o caminho.</span></div>
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
      <div style={{ padding: '15px', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'space-between', zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 5, fontSize: '1rem' }}><ArrowLeft /> Voltar</button>
        <strong style={{fontSize: '1.2rem'}}>Mapa AcessaAí</strong>
        <div style={{ width: 24 }}></div>
      </div>

      <MapContainer center={[-5.915, -35.263]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        <ControladorDeCliques />
        {rota && <Polyline positions={rota} color="#3498db" dashArray="10, 10" weight={6} />}
        
        {pontos.map(p => (
          <Marker key={p.id_firebase} position={[p.lat, p.lng]} icon={criarIcone(p.emoji, p.avaliacao)}>
            <Popup>
              <div style={{ width: '200px', fontSize: '1rem' }}>
                <strong style={{ color: coresAvaliacao[p.avaliacao] }}>{p.emoji} {p.texto}</strong>
                <p style={{ margin: '5px 0', fontSize: '0.9rem', color: '#333' }}>"{p.comentario || 'Sem comentários'}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                   <small style={{color:'#7f8c8d'}}>Por: {p.userName?.split(' ')[0]}</small>
                   <div style={{ display: 'flex', gap: '5px' }}>
                     <button onClick={() => tracarRota(p)} title="Traçar rota até aqui" style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', padding: '8px', cursor: 'pointer' }}><Navigation size={20}/></button>
                     {auth.currentUser.uid === p.userId && (
                       <button onClick={() => deleteDoc(doc(db, "pontos", p.id_firebase))} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', padding: '8px' }}><Trash2 size={20}/></button>
                     )}
                   </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {modalAberto && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', padding: '20px', borderTopLeftRadius: '25px', borderTopRightRadius: '25px', zIndex: 9999, boxShadow: '0 -5px 30px rgba(0,0,0,0.15)', maxHeight: '80vh', overflowY: 'auto' }}>
          <h3 style={{fontSize: '1.6rem', color: '#2c3e50', fontWeight:'800', marginBottom: '15px'}}>Novo Reporte 📍</h3>
          
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px' }}>
            {Object.entries(opcoesDeficiencia).map(([key, val]) => (
              <button key={key} onClick={() => { setCategoriaAtiva(key); setProblemaAtivo(val.problemas[0]); }} style={{ padding: '10px 18px', borderRadius: '30px', border: categoriaAtiva === key ? 'none' : '1px solid #ddd', background: categoriaAtiva === key ? '#2c3e50' : '#f8f9fa', color: categoriaAtiva === key ? 'white' : '#7f8c8d', whiteSpace: 'nowrap', fontSize: '1rem', fontWeight: 'bold' }}>{val.emojiCategoria} {val.titulo}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {opcoesDeficiencia[categoriaAtiva].problemas.map(prob => (
              <button key={prob.id} onClick={() => setProblemaAtivo(prob)} style={{ padding: '10px', borderRadius: '10px', background: problemaAtivo.id === prob.id ? '#e8f4f8' : '#fff', border: problemaAtivo.id === prob.id ? '2px solid #3498db' : '1px solid #ddd', fontSize: '0.9rem', color: '#2c3e50' }}>{prob.emoji} {prob.nome}</button>
            ))}
          </div>

          <div style={{ marginTop: '20px' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '1rem', color: '#2c3e50' }}>Nível de Acessibilidade:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button onClick={() => setAvaliacao('boa')} style={{ flex: 1, padding: '12px', background: avaliacao === 'boa' ? coresAvaliacao.boa : '#f1f2f6', color: avaliacao === 'boa' ? 'white' : '#7f8c8d', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Boa 😄</button>
              <button onClick={() => setAvaliacao('media')} style={{ flex: 1, padding: '12px', background: avaliacao === 'media' ? coresAvaliacao.media : '#f1f2f6', color: avaliacao === 'media' ? 'white' : '#7f8c8d', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Média 😐</button>
              <button onClick={() => setAvaliacao('ruim')} style={{ flex: 1, padding: '12px', background: avaliacao === 'ruim' ? coresAvaliacao.ruim : '#f1f2f6', color: avaliacao === 'ruim' ? 'white' : '#7f8c8d', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 'bold' }}>Péssima 😡</button>
            </div>
          </div>
          
          <textarea placeholder="Deixe um comentário..." value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '1rem', fontFamily: 'sans-serif' }} rows={3} />
          
          <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
            <button onClick={() => setModalAberto(false)} style={{ flex: 1, padding: '15px', background: '#ecf0f1', color: '#7f8c8d', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold' }}>Cancelar</button>
            <button onClick={salvarPonto} disabled={enviando} style={{ flex: 1, padding: '15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem' }}>{enviando ? 'Enviando...' : 'Publicar 📢'}</button>
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