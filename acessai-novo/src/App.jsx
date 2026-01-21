import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate, Trash2, LogOut, Map as MapIcon, History, Info, ArrowLeft, Navigation } from 'lucide-react'; // Removi Camera
import L from 'leaflet';

// --- FIREBASE IMPORTS ---
// Removi o 'storage' daqui para não dar erro
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

// --- TELA 1: LOGIN ---
function TelaLogin() {
  const logarComGoogle = async () => { try { await signInWithPopup(auth, provider); } catch (error) { alert("Erro: " + error.message); } };
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#2c3e50', color: 'white', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>AcessaAí ♿</h1>
      <p>Sua rede social de acessibilidade urbana.</p>
      <button onClick={logarComGoogle} style={{ padding: '15px 30px', background: 'white', color: '#333', border: 'none', borderRadius: '50px', fontWeight: 'bold', display: 'flex', gap: '10px', cursor: 'pointer' }}>Entrar com Google</button>
    </div>
  );
}

// --- TELA 2: MENU ---
function TelaInicial({ user }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <h2>Olá, {user.displayName?.split(' ')[0]}!</h2>
        <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', color: '#c0392b' }}><LogOut /></button>
      </header>
      <div style={{ display: 'grid', gap: '15px' }}>
        <div onClick={() => navigate('/mapa')} style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer' }}>
          <MapIcon size={32} /> <div><h3>Abrir Mapa</h3><small>Navegar e Reportar</small></div>
        </div>
        <div onClick={() => navigate('/historico')} style={{ background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <History size={24} color="#f1c40f" /> <h3>Minhas Contribuições</h3>
        </div>
      </div>
    </div>
  );
}

// --- TELA 3: MAPA (SEM FOTOS) ---
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
    navigator.geolocation.getCurrentPosition((pos) => { setRota([[pos.coords.latitude, pos.coords.longitude], [destino.lat, destino.lng]]); });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'space-between', zIndex: 1000 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white' }}><ArrowLeft /></button>
        <strong>Mapa AcessaAí</strong>
        <div style={{ width: 24 }}></div>
      </div>

      <MapContainer center={[-5.915, -35.263]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        <ControladorDeCliques />
        {rota && <Polyline positions={rota} color="blue" dashArray="10, 10" />}
        {pontos.map(p => (
          <Marker key={p.id_firebase} position={[p.lat, p.lng]} icon={criarIcone(p.emoji, p.avaliacao)}>
            <Popup>
              <div style={{ width: '200px' }}>
                <strong style={{ color: coresAvaliacao[p.avaliacao] }}>{p.emoji} {p.texto}</strong>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>"{p.comentario || 'Sem comentários'}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                   <small>Por: {p.userName?.split(' ')[0]}</small>
                   <div style={{ display: 'flex', gap: '5px' }}>
                     <button onClick={() => tracarRota(p)} title="Ir até lá" style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', padding: '5px' }}><Navigation size={16}/></button>
                     {auth.currentUser.uid === p.userId && (
                       <button onClick={() => deleteDoc(doc(db, "pontos", p.id_firebase))} style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', padding: '5px' }}><Trash2 size={16}/></button>
                     )}
                   </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {modalAberto && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', padding: '20px', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', zIndex: 9999, boxShadow: '0 -5px 20px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }}>
          <h3>Novo Reporte 📍</h3>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {Object.entries(opcoesDeficiencia).map(([key, val]) => (
              <button key={key} onClick={() => { setCategoriaAtiva(key); setProblemaAtivo(val.problemas[0]); }} style={{ padding: '8px 15px', borderRadius: '20px', border: categoriaAtiva === key ? '2px solid #333' : '1px solid #ccc', background: categoriaAtiva === key ? '#eee' : 'white', whiteSpace: 'nowrap' }}>{val.emojiCategoria} {val.titulo}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto' }}>
            {opcoesDeficiencia[categoriaAtiva].problemas.map(prob => (
              <button key={prob.id} onClick={() => setProblemaAtivo(prob)} style={{ padding: '10px', borderRadius: '10px', background: problemaAtivo.id === prob.id ? '#dff9fb' : '#fff', border: '1px solid #ccc' }}>{prob.emoji} {prob.nome}</button>
            ))}
          </div>
          <div style={{ marginTop: '15px' }}>
            <p style={{ margin: '0 0 5px 0' }}>Nível de Acessibilidade:</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
              <button onClick={() => setAvaliacao('boa')} style={{ flex: 1, padding: '10px', background: avaliacao === 'boa' ? coresAvaliacao.boa : '#eee', color: avaliacao === 'boa' ? 'white' : 'black', border: 'none', borderRadius: '8px' }}>Boa 😄</button>
              <button onClick={() => setAvaliacao('media')} style={{ flex: 1, padding: '10px', background: avaliacao === 'media' ? coresAvaliacao.media : '#eee', color: avaliacao === 'media' ? 'white' : 'black', border: 'none', borderRadius: '8px' }}>Média 😐</button>
              <button onClick={() => setAvaliacao('ruim')} style={{ flex: 1, padding: '10px', background: avaliacao === 'ruim' ? coresAvaliacao.ruim : '#eee', color: avaliacao === 'ruim' ? 'white' : 'black', border: 'none', borderRadius: '8px' }}>Péssima 😡</button>
            </div>
          </div>
          <textarea placeholder="Deixe um comentário..." value={comentario} onChange={(e) => setComentario(e.target.value)} style={{ width: '100%', marginTop: '10px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} rows={3} />
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setModalAberto(false)} style={{ flex: 1, padding: '15px', background: '#ccc', border: 'none', borderRadius: '10px' }}>Cancelar</button>
            <button onClick={salvarPonto} disabled={enviando} style={{ flex: 1, padding: '15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' }}>{enviando ? 'Enviando...' : 'Publicar 📢'}</button>
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
        <Route path="/" element={user ? <TelaInicial user={user} /> : <TelaLogin />} />
        <Route path="/mapa" element={user ? <TelaMapa /> : <TelaLogin />} />
        <Route path="/historico" element={user ? <TelaHistorico /> : <TelaLogin />} />
      </Routes>
    </Router>
  );
}