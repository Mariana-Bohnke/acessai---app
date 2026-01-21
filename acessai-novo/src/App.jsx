import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Locate, Trash2, LogOut, Map as MapIcon, History, Info, ArrowLeft, CheckCircle } from 'lucide-react';
import L from 'leaflet';

// --- FIREBASE IMPORTS ---
import { db } from './firebaseConfig';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, where } from 'firebase/firestore';

// --- CONFIGURAÇÃO (Alterado aqui!) ---
const opcoesDeficiencia = {
  motora: { 
    titulo: "Mobilidade", 
    cor: "#e74c3c", 
    emojiCategoria: "♿", 
    problemas: [
      { id: 'rampa', nome: 'Sem Rampa', emoji: '↘️' }, // <--- MUDANÇA FEITA AQUI
      { id: 'calcada', nome: 'Calçada Irregular', emoji: '🚧' }, 
      { id: 'estreita', nome: 'Passagem Estreita', emoji: '↔️' }, 
      { id: 'vaga', nome: 'Vaga Indevida', emoji: '🚫' }
    ] 
  },
  visual: { titulo: "Visual", cor: "#f1c40f", emojiCategoria: "👁️", problemas: [{ id: 'piso', nome: 'Sem Piso Tátil', emoji: '🟦' }, { id: 'obstaculo', nome: 'Objeto Suspenso', emoji: '⚠️' }, { id: 'semaforo', nome: 'Semáforo Mudo', emoji: '🔇' }] },
  auditiva: { titulo: "Auditiva", cor: "#3498db", emojiCategoria: "👂", problemas: [{ id: 'aviso', nome: 'Sem Aviso Visual', emoji: '👀' }, { id: 'interprete', nome: 'Falta Intérprete', emoji: '👋' }] },
  cognitiva: { titulo: "Intelectual", cor: "#9b59b6", emojiCategoria: "🧠", problemas: [{ id: 'sinalizacao', nome: 'Placa Confusa', emoji: '❓' }, { id: 'barulho', nome: 'Poluição Sonora', emoji: '📢' }] }
};

const criarIcone = (emoji, cor) => {
  return L.divIcon({
    html: `<div style="background-color: ${cor}; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 35]
  });
};

const auth = getAuth();
const provider = new GoogleAuthProvider();

// --- TELA 1: LOGIN ---
function TelaLogin() {
  const logarComGoogle = async () => {
    try { await signInWithPopup(auth, provider); } catch (error) { alert("Erro: " + error.message); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#2c3e50', color: 'white', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>AcessaAí ♿</h1>
      <p style={{ marginBottom: '30px', opacity: 0.8 }}>Mapeando a acessibilidade da cidade.</p>
      <button onClick={logarComGoogle} style={{ padding: '15px 30px', background: 'white', color: '#333', border: 'none', borderRadius: '50px', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
        <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Entrar com Google
      </button>
    </div>
  );
}

// --- TELA 2: MENU INICIAL ---
function TelaInicial({ user }) {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: 0 }}>Olá, {user.displayName?.split(' ')[0]}!</h2>
          <small style={{ color: '#7f8c8d' }}>Vamos mapear hoje?</small>
        </div>
        <button onClick={() => signOut(auth)} style={{ background: '#ffebee', border: 'none', color: '#c0392b', padding: '10px', borderRadius: '50%', cursor: 'pointer' }} title="Sair"><LogOut size={20} /></button>
      </header>

      <div style={{ display: 'grid', gap: '15px' }}>
        <div onClick={() => navigate('/mapa')} style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(52, 152, 219, 0.4)' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '15px' }}><MapIcon size={32} color="white" /></div>
          <div><h3 style={{ margin: 0, fontSize: '1.2rem' }}>Abrir Mapa</h3><span style={{ opacity: 0.9, fontSize: '0.9rem' }}>Adicionar ou ver alertas</span></div>
        </div>

        <div onClick={() => navigate('/historico')} style={{ background: 'white', border: '1px solid #eee', color: '#2c3e50', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{ background: '#f1c40f', padding: '12px', borderRadius: '12px', color: 'white' }}><History size={24} /></div>
          <div><h4 style={{ margin: 0 }}>Minhas Contribuições</h4><small style={{ color: '#95a5a6' }}>Ver o que eu postei</small></div>
        </div>

        <div onClick={() => navigate('/tutorial')} style={{ background: 'white', border: '1px solid #eee', color: '#2c3e50', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{ background: '#95a5a6', padding: '12px', borderRadius: '12px', color: 'white' }}><Info size={24} /></div>
          <div><h4 style={{ margin: 0 }}>Como funciona?</h4><small style={{ color: '#95a5a6' }}>Tutorial rápido</small></div>
        </div>
      </div>
    </div>
  );
}

// --- TELA NOVA: HISTÓRICO ---
function TelaHistorico() {
  const [meusPontos, setMeusPontos] = useState([]);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "pontos"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id_firebase: doc.id, ...doc.data() }));
      setMeusPontos(lista);
    });
    return () => unsubscribe();
  }, [user]);

  const apagarPonto = async (id) => {
    if (confirm("Quer mesmo apagar este registro?")) await deleteDoc(doc(db, "pontos", id));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '16px', marginBottom: '20px', cursor: 'pointer' }}><ArrowLeft /> Voltar</button>
      <h2>Minhas Contribuições 📝</h2>
      
      {meusPontos.length === 0 ? <p style={{color: '#777'}}>Você ainda não marcou nada no mapa.</p> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {meusPontos.map(p => (
          <div key={p.id_firebase} style={{ padding: '15px', border: `1px solid ${p.cor}`, borderRadius: '10px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ color: p.cor }}>{p.emoji} {p.texto}</strong>
              <div style={{ fontSize: '12px', color: '#888' }}>{new Date(p.data).toLocaleDateString()}</div>
            </div>
            <button onClick={() => apagarPonto(p.id_firebase)} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- TELA NOVA: TUTORIAL ---
function TelaTutorial() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '16px', marginBottom: '20px', cursor: 'pointer' }}><ArrowLeft /> Voltar</button>
      <h2>Como usar o AcessaAí 💡</h2>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#3498db', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>1</div>
          <div><strong>Abra o Mapa:</strong><br/>Clique no botão azul na tela inicial para ver a sua cidade.</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#3498db', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>2</div>
          <div><strong>Escolha a Categoria:</strong><br/>Selecione se o problema é Motor, Visual, Auditivo ou Cognitivo no topo.</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#3498db', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>3</div>
          <div><strong>Marque o Ponto:</strong><br/>Toque no lugar exato do mapa onde existe a barreira.</div>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', padding: '15px', background: '#e8f6f3', borderRadius: '10px', color: '#16a085', display: 'flex', gap: '10px' }}>
        <CheckCircle />
        <small>Pronto! Você ajudou a tornar a cidade mais acessível.</small>
      </div>
    </div>
  );
}

// --- TELA 3: MAPA ---
function TelaMapa() {
  const [pontos, setPontos] = useState([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState('motora');
  const [problemaAtivo, setProblemaAtivo] = useState(opcoesDeficiencia['motora'].problemas[0]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "pontos"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id_firebase: doc.id, ...doc.data() }));
      setPontos(lista);
    });
    return () => unsubscribe();
  }, []);

  const adicionarPonto = async (latlng) => {
    const user = auth.currentUser;
    if (!user) return alert("Faça login!");
    const dadosCategoria = opcoesDeficiencia[categoriaAtiva];
    await addDoc(collection(db, "pontos"), {
      lat: latlng.lat, lng: latlng.lng, texto: problemaAtivo.nome, emoji: problemaAtivo.emoji,
      cor: dadosCategoria.cor, categoria: dadosCategoria.titulo, userId: user.uid, userName: user.displayName,
      data: new Date().toISOString()
    });
  };

  const apagarPonto = async (id) => { if (confirm("Resolver este problema?")) await deleteDoc(doc(db, "pontos", id)); };
  function ControladorDeCliques() { useMapEvents({ click(e) { adicionarPonto(e.latlng); } }); return null; }
  function BotaoLocalizacao() {
      const map = useMap();
      const buscarLocalizacao = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition((pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 17));
      };
      return (<div className="leaflet-top leaflet-right"><div className="leaflet-control leaflet-bar"><button onClick={buscarLocalizacao} style={{ width: '40px', height: '40px', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Locate size={24} color="#333" /></button></div></div>);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '15px', background: '#2c3e50', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1000 }}>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><ArrowLeft size={20}/> Voltar</button>
        <span style={{ fontWeight: 'bold' }}>Mapa AcessaAí</span>
        <div style={{ width: 50 }}></div>
      </div>
      <div style={{ background: '#34495e', padding: '10px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
         {Object.entries(opcoesDeficiencia).map(([chave, dados]) => (
          <button key={chave} onClick={() => { setCategoriaAtiva(chave); setProblemaAtivo(dados.problemas[0]); }} style={{ padding: '8px 15px', borderRadius: '20px', border: 'none', margin: '0 5px', background: categoriaAtiva === chave ? dados.cor : '#7f8c8d', color: 'white', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', cursor: 'pointer' }}>{dados.emojiCategoria} {dados.titulo}</button>
        ))}
      </div>
      <MapContainer center={[-5.915, -35.263]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        <ControladorDeCliques /><BotaoLocalizacao />
        {pontos.map(p => (
          <Marker key={p.id_firebase} position={[p.lat, p.lng]} icon={criarIcone(p.emoji, p.cor)}>
            <Popup><strong style={{color: p.cor}}>{p.categoria}</strong><br/>{p.emoji} {p.texto}<br/><small style={{color: '#7f8c8d'}}>Por: {p.userName?.split(' ')[0] || 'Anônimo'}</small><br/><button onClick={() => apagarPonto(p.id_firebase)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px', width: '100%', marginTop: '10px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}><Trash2 size={14}/> Resolver</button></Popup>
          </Marker>
        ))}
      </MapContainer>
      <div style={{ background: 'white', padding: '15px', overflowX: 'auto', whiteSpace: 'nowrap', borderTop: '1px solid #ddd' }}>
        {opcoesDeficiencia[categoriaAtiva].problemas.map((prob) => (
          <button key={prob.id} onClick={() => setProblemaAtivo(prob)} style={{ padding: '10px 15px', margin: '0 5px', borderRadius: '10px', border: problemaAtivo.id === prob.id ? `2px solid ${opcoesDeficiencia[categoriaAtiva].cor}` : '1px solid #ecf0f1', background: problemaAtivo.id === prob.id ? '#fff' : '#f9f9f9', color: '#333', fontWeight: problemaAtivo.id === prob.id ? 'bold' : 'normal', cursor: 'pointer' }}>{prob.emoji} {prob.nome}</button>
        ))}
      </div>
    </div>
  );
}

// --- APP PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState(null);
  useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u)); return () => unsubscribe(); }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <TelaInicial user={user} /> : <TelaLogin />} />
        <Route path="/mapa" element={user ? <TelaMapa /> : <TelaLogin />} />
        <Route path="/historico" element={user ? <TelaHistorico /> : <TelaLogin />} />
        <Route path="/tutorial" element={user ? <TelaTutorial /> : <TelaLogin />} />
      </Routes>
    </Router>
  );
}