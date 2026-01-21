import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Locate, Trash2, LogOut, Map as MapIcon, History, Info, 
  ArrowLeft, Navigation, CheckCircle, Star, Users, Mail 
} from 'lucide-react';
import L from 'leaflet';

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

// --- TELA 1: LANDING PAGE (VITRINE) ---
function TelaLanding() {
  const logarComGoogle = async () => { try { await signInWithPopup(auth, provider); } catch (error) { alert("Erro: " + error.message); } };

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#2c3e50', overflowX: 'hidden' }}>
      
      {/* 1. NAVBAR / CABEÇALHO */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 5%', background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#3498db', padding: '5px', borderRadius: '5px' }}>
            <span style={{ fontSize: '24px' }}>♿</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#2c3e50' }}>AcessaAí</h1>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#como-funciona" style={{ textDecoration: 'none', color: '#7f8c8d', fontWeight: '500', display: 'none' }}>Como Funciona</a> {/* Oculto em mobile para não quebrar */}
          <button onClick={logarComGoogle} style={{ padding: '10px 20px', background: '#3498db', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' }}>
            Entrar
          </button>
        </div>
      </nav>

      {/* 2. HERÓI (HERO SECTION) */}
      <header style={{ padding: '60px 5%', textAlign: 'center', background: 'linear-gradient(180deg, #fdfbfb 0%, #ebedee 100%)' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '15px', lineHeight: 1.2 }}>Encontre e avalie a acessibilidade<br/>da sua cidade.</h2>
        <p style={{ fontSize: '1.1rem', color: '#7f8c8d', maxWidth: '600px', margin: '0 auto 30px' }}>
          Navegue por um mapa em tempo real, compartilhe rotas acessíveis e ajude a comunidade. Sua mobilidade é nossa prioridade.
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '40px' }}>
          <button onClick={logarComGoogle} style={{ padding: '15px 30px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 5px 15px rgba(44, 62, 80, 0.3)' }}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" style={{width: 20}}/>
            Entrar com Google
          </button>
        </div>
        
        {/* IMAGEM DO MAPA (Substitua o src abaixo pelo link do seu print depois se quiser) */}
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <img 
              src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
              alt="Mapa em tempo real do AcessaAí" 
              style={{ width: '100%', borderRadius: '10px', display: 'block' }}
            />
            <small style={{display:'block', marginTop: 10, color: '#999'}}>*Imagem ilustrativa do mapa em funcionamento</small>
        </div>
      </header>

      {/* 3. COMO FUNCIONA (TEXTO ATUALIZADO) */}
      <section id="como-funciona" style={{ padding: '60px 5%', background: 'white' }}>
        <h3 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '40px' }}>Como Funciona?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: 60, height: 60, background: '#e8f4f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#3498db' }}><MapIcon size={30}/></div>
            <h4 style={{fontSize: '1.2rem'}}>1. Cadastre-se e visualize</h4>
            <p style={{color: '#7f8c8d'}}>Faça seu login rápido e tenha acesso imediato ao mapa da sua cidade.</p>
          </div>

          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: 60, height: 60, background: '#fff9c4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#fbc02d' }}><Star size={30}/></div>
            <h4 style={{fontSize: '1.2rem'}}>2. Avalie locais</h4>
            <p style={{color: '#7f8c8d'}}>Classifique a acessibilidade como <strong>Bom</strong>, <strong>Médio</strong> ou <strong>Ruim</strong>.</p>
          </div>

          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ width: 60, height: 60, background: '#e8f5e9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#2ecc71' }}><Users size={30}/></div>
            <h4 style={{fontSize: '1.2rem'}}>3. Compartilhe</h4>
            <p style={{color: '#7f8c8d'}}>Trace rotas, leia comentários e ajude a comunidade a se mover melhor.</p>
          </div>
          
        </div>
      </section>

      {/* 4. RODAPÉ */}
      <footer id="contato" style={{ background: '#2c3e50', color: 'white', padding: '40px 5%', textAlign: 'center' }}>
        <div style={{ marginBottom: '20px' }}>
            <h4 style={{margin: 0}}>AcessaAí ♿</h4>
            <small>Mapeando a acessibilidade com você.</small>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Mail size={16}/> contato@acessaai.com</span>
        </div>
        <div style={{ borderTop: '1px solid #34495e', paddingTop: '20px', fontSize: '0.9rem', color: '#95a5a6' }}>
            &copy; 2026 AcessaAí. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

// --- TELA 2: MENU ---
function TelaInicial({ user }) {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
           <h2>Olá, {user.displayName?.split(' ')[0]}!</h2>
           <small style={{color: '#7f8c8d'}}>Vamos mapear hoje?</small>
        </div>
        <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', color: '#c0392b' }} title="Sair"><LogOut /></button>
      </header>
      
      <div style={{ display: 'grid', gap: '15px' }}>
        <div onClick={() => navigate('/mapa')} style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', padding: '25px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)' }}>
          <MapIcon size={32} /> <div><h3>Abrir Mapa</h3><small>Navegar e Reportar</small></div>
        </div>
        
        <div onClick={() => navigate('/historico')} style={{ background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{background: '#f1c40f', padding: 10, borderRadius: 10, color: 'white'}}><History size={24}/></div>
          <h3>Minhas Contribuições</h3>
        </div>

        <div onClick={() => navigate('/tutorial')} style={{ background: '#fff', border: '1px solid #eee', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          <div style={{background: '#95a5a6', padding: 10, borderRadius: 10, color: 'white'}}><Info size={24}/></div>
          <div><h3>Como funciona?</h3><small>Aprenda a usar</small></div>
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
      <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '16px', marginBottom: '20px', cursor: 'pointer' }}><ArrowLeft /> Voltar</button>
      <h2>Como usar o AcessaAí 💡</h2>
      <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#3498db', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>1</div>
          <div><strong>Abra o Mapa:</strong> Clique no botão azul para ver a cidade.</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#2ecc71', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>2</div>
          <div><strong>Avalie:</strong> Clique no local, escolha a cor (Verde/Amarelo/Vermelho) e deixe seu comentário.</div>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ background: '#f1c40f', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>3</div>
          <div><strong>Rotas:</strong> Clique no pino de um problema e aperte o botão azul <Navigation size={14} style={{display:'inline'}}/> para traçar o caminho até lá.</div>
        </div>
      </div>
      <div style={{ marginTop: '30px', padding: '15px', background: '#e8f6f3', borderRadius: '10px', color: '#16a085', display: 'flex', gap: '10px' }}>
        <CheckCircle /> <small>Pronto! Você está ajudando a cidade.</small>
      </div>
    </div>
  );
}

// --- TELA 3: MAPA ---
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
      <div style={{ padding: '15px', background: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'space-between', zIndex: 1000 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: 5 }}><ArrowLeft /> Voltar</button>
        <strong>Mapa AcessaAí</strong>
        <div style={{ width: 24 }}></div>
      </div>

      <MapContainer center={[-5.915, -35.263]} zoom={13} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
        <ControladorDeCliques />
        {rota && <Polyline positions={rota} color="#3498db" dashArray="10, 10" weight={5} />}
        
        {pontos.map(p => (
          <Marker key={p.id_firebase} position={[p.lat, p.lng]} icon={criarIcone(p.emoji, p.avaliacao)}>
            <Popup>
              <div style={{ width: '200px' }}>
                <strong style={{ color: coresAvaliacao[p.avaliacao] }}>{p.emoji} {p.texto}</strong>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>"{p.comentario || 'Sem comentários'}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                   <small>Por: {p.userName?.split(' ')[0]}</small>
                   <div style={{ display: 'flex', gap: '5px' }}>
                     <button onClick={() => tracarRota(p)} title="Traçar rota até aqui" style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: '5px', padding: '5px', cursor: 'pointer' }}><Navigation size={16}/></button>
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
        <Route path="/" element={user ? <TelaInicial user={user} /> : <TelaLanding />} />
        <Route path="/mapa" element={user ? <TelaMapa /> : <TelaLanding />} />
        <Route path="/historico" element={user ? <TelaHistorico /> : <TelaLanding />} />
        <Route path="/tutorial" element={user ? <TelaTutorial /> : <TelaLanding />} />
      </Routes>
    </Router>
  );
}