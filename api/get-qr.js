function QR({ amount }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    setSrc(`/api/get-qr?amount=${amount}&t=${Date.now()}`);
  }, [amount]);
  return src
    ? <img src={src} alt="Scan to pay" width={180} height={180} style={{borderRadius:8,display:"block"}}/>
    : <div style={{width:180,height:180,background:"#eee",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#999"}}>Loading QR...</div>;
}
