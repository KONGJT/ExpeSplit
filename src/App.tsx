import { useState, useRef, useEffect } from 'react'
import './App.css'


function App() {

  // Stores the custom names entered by the user
  const [names, setNames] = useState<string[]>([]);
  
  // Set and change pages
  const [page, setPage] = useState<number>(1);

  // Confirming pax number
  const [pax, setPax] = useState<number>(0);
  const sufficientPax = pax >= 2;
  const [confirmedPax, setConfirmedPax] = useState<number>(0);

  const personNames = names.length > 0 ? names : Array.from({ length: confirmedPax }, (_, i) => `P${i + 1}`);

  // List of activities with their own costs
  const [activities, setActivities] = useState<{id: number, name: string, cost: number}[]>([]);
  const [activityName, setActivityName] = useState("");
  const [activityCost, setActivityCost] = useState(0);

  // Shared meal splitting
  const [totalSharedMeal, setTotalSharedMeal] = useState<number>(0);
  const sharedMealSplit = confirmedPax > 1 ? totalSharedMeal / confirmedPax : 0;

  // Separated Meals - new table system
  const [dishes, setDishes] = useState<{id: number, name: string, price: number, splits: Record<string, number>}[]>([]);
  const [newDishName, setNewDishName] = useState("");
  const [newDishPrice, setNewDishPrice] = useState<number>(0);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(10);
  const [taxPercent, setTaxPercent] = useState<number>(6);
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const getGrandTotal = () => 
  personNames.reduce((sum, p) => sum + getPersonTotal(p), 0);

  const addDish = () => {
    if (!newDishName || newDishPrice <= 0) return;
    const splits: Record<string, number> = {};
    personNames.forEach(p => splits[p] = 0);
    setDishes(prev => [...prev, { id: Date.now(), name: newDishName, price: newDishPrice, splits }]);
    setNewDishName("");
    setNewDishPrice(0);
  };

  const updateSplit = (dishId: number, person: string, value: number) => {
  setDishes(prev => prev.map(d => {
    if (d.id !== dishId) return d;
    const otherTotal = Object.entries(d.splits)
      .filter(([key]) => key !== person)
      .reduce((sum, [, val]) => sum + val, 0);
    const clamped = Math.min(value, 100 - otherTotal);
    return { ...d, splits: { ...d.splits, [person]: Math.max(0, clamped) } };
    }));
  };

  const removeDish = (dishId: number) => {
    setDishes(prev => prev.filter(d => d.id !== dishId));
  };

  const getPersonSubtotal = (person: string) =>
    dishes.reduce((sum, d) => sum + (d.price * (d.splits[person] || 0) / 100), 0);

  const getPersonTotal = (person: string) => {
  const sub = getPersonSubtotal(person);
  
  const serviceCharge = sub * (serviceChargePercent / 100);
  const tax = sub * (taxPercent / 100);
  
  const totalBeforeDiscount = sub + serviceCharge + tax;
  
  // Split the discount equally among everyone
  const discountShare = confirmedPax > 0 ? discountAmount / confirmedPax : 0;
  
  return Math.max(0, totalBeforeDiscount - discountShare);
};

  const resetSeparatedMeal = () => {
    setDishes([]);
    setNewDishName("");
    setNewDishPrice(0);
  };

  // Carpool Distance States
  const [distance, setDistance] = useState<number>(0);
  const [ratePerKm, setRatePerKm] = useState<number>(0);
  const [tollCost, setTollCost] = useState<number>(0);
  const [driverSplitsAll, setDriverSplitsAll] = useState<boolean>(true);

  const calculatedPetrol = distance * ratePerKm;
  const totalTripCost = calculatedPetrol + tollCost;

  const perPaxShare = confirmedPax > 0 ? totalTripCost / confirmedPax : 0;
  const passengerOnlyShare = (confirmedPax > 1) ? totalTripCost / (confirmedPax - 1) : totalTripCost;

  const finalPassenger = driverSplitsAll ? perPaxShare : passengerOnlyShare;
  const finalDriver = driverSplitsAll ? perPaxShare : 0;

  const addActivity = () => {
    if (activityName && activityCost > 0) {
      const newItem = { id: Date.now(), name: activityName, cost: activityCost };
      setActivities([...activities, newItem]);
      setActivityName("");
      setActivityCost(0);
    }
  };

  const totalVacationCost = activities.reduce((sum, item) => sum + item.cost, 0);
  const resetVacationList = () => {
    setActivities([]);
    setActivityName("");
    setActivityCost(0);
  }

  // Picking Boxes
  const [boxAssignments, setBoxAssignments] = useState<{picker: string, player: string}[]>([]);
  const [currentPickerIdx, setCurrentPickerIdx] = useState(0);
  const [shuffledPlayers, setShuffledPlayers] = useState<string[]>([]);
  const [revealedBox, setRevealedBox] = useState<number | null>(null);
  const [takenBoxes, setTakenBoxes] = useState<number[]>([]);

  const startBoxGame = () => {

    const numericArray = Array.from({ length: confirmedPax }, (_, i) => i + 1);
    
    // Shuffle Player Numbers
    for (let i = numericArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numericArray[i], numericArray[j]] = [numericArray[j], numericArray[i]];
    }
    
    setShuffledPlayers(numericArray.map(n => n.toString()));
    
    setBoxAssignments([]);
    setCurrentPickerIdx(0);
    setRevealedBox(null);
    setTakenBoxes([]);
  };

  const pickBox = (i: number) => {
    if (takenBoxes.includes(i) || revealedBox !== null || currentPickerIdx >= personNames.length) return;
    
    const playerAssigned = shuffledPlayers[i];
    setRevealedBox(i);

    setTimeout(() => {
      setBoxAssignments(prev => [
        ...prev, 
        { picker: personNames[currentPickerIdx], player: playerAssigned }
      ]);
      setTakenBoxes(prev => [...prev, i]);
      setRevealedBox(null);
      setCurrentPickerIdx(prev => prev + 1);
    }, 1800);
  };

  // Plinko
  const plinkoCanvasRef = useRef<HTMLCanvasElement>(null);
  const [plinkoWinner, setPlinkoWinner] = useState<number | null>(null);
  const [plinkoDropping, setPlinkoDropping] = useState(false);

  const drawStaticPlinkoBoard = () => {
    const canvas = plinkoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const SLOT_H = 52, BOARD_BOT = H - SLOT_H;
    const ROWS = 7, PEG_R = 5, BOARD_TOP = 30;
    ctx.clearRect(0, 0, W, H);
    const sw = W / personNames.length;
    personNames.forEach((label, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#333' : '#2a2a2a';
      ctx.fillRect(i * sw, BOARD_BOT, sw, SLOT_H);
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
      ctx.strokeRect(i * sw, BOARD_BOT, sw, SLOT_H);
      ctx.fillStyle = '#888'; ctx.font = '11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, i * sw + sw / 2, BOARD_BOT + SLOT_H / 2);
    });
    for (let r = 0; r < ROWS; r++) {
      const cols = r + 3;
      const rowW = (cols - 1) * 34;
      const startX = W / 2 - rowW / 2;
      const y = BOARD_TOP + 36 + r * 44;
      for (let c = 0; c < cols; c++) {
        ctx.beginPath();
        ctx.arc(startX + c * 34, y, PEG_R, 0, Math.PI * 2);
        ctx.fillStyle = '#fab005'; ctx.fill();
      }
    }
  };

  const playPlinko = () => {
    if (plinkoDropping) return;
    const canvas = plinkoCanvasRef.current;
    if (!canvas) return;
    setPlinkoDropping(true);
    setPlinkoWinner(null);
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width, H = canvas.height;
    const ROWS = 7, PEG_R = 5, BALL_R = 10;
    const SLOT_H = 52, BOARD_TOP = 30, BOARD_BOT = H - SLOT_H;
    const pegs: { x: number; y: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      const cols = r + 3;
      const rowW = (cols - 1) * 34;
      const startX = W / 2 - rowW / 2;
      const y = BOARD_TOP + 36 + r * 44;
      for (let c = 0; c < cols; c++) pegs.push({ x: startX + c * 34, y });
    }
    let bx = W / 2 + (Math.random() - 0.5) * 8;
    let by = BOARD_TOP + 8;
    let vx = (Math.random() - 0.5) * 1.5;
    let vy = 1.2;
    const gravity = 0.05, friction = 0.80;
    const drawFrame = (landedSlot: number) => {
      ctx.clearRect(0, 0, W, H);
      const sw = W / personNames.length;
      personNames.forEach((label, i) => {
        ctx.fillStyle = landedSlot === i ? '#e63946' : (i % 2 === 0 ? '#333' : '#2a2a2a');
        ctx.fillRect(i * sw, BOARD_BOT, sw, SLOT_H);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 1;
        ctx.strokeRect(i * sw, BOARD_BOT, sw, SLOT_H);
        ctx.fillStyle = landedSlot === i ? '#fff' : '#888';
        ctx.font = landedSlot === i ? 'bold 12px sans-serif' : '11px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label, i * sw + sw / 2, BOARD_BOT + SLOT_H / 2);
      });
      pegs.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
        ctx.fillStyle = '#fab005'; ctx.fill();
      });
      if (landedSlot === -1) {
        ctx.beginPath(); ctx.arc(bx, by, BALL_R, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(bx - 3, by - 3, 1, bx, by, BALL_R);
        grad.addColorStop(0, '#ffe566'); grad.addColorStop(1, '#b2700e');
        ctx.fillStyle = grad; ctx.fill();
      }
    };
    const step = () => {
      vy += gravity; bx += vx; by += vy;
      if (bx < BALL_R) { bx = BALL_R; vx = Math.abs(vx) * 0.5 + Math.random() * 0.5; }
      if (bx > W - BALL_R) { bx = W - BALL_R; vx = -Math.abs(vx) * 0.5 - Math.random() * 0.5; }
      for (const p of pegs) {
        const dx = bx - p.x, dy = by - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < BALL_R + PEG_R) {
          const overlap = BALL_R + PEG_R - dist;
          const nx = dx / dist, ny = dy / dist;
          bx += nx * overlap; by += ny * overlap;
          const dot = vx * nx + vy * ny;
          vx = (vx - 2 * dot * nx) * friction + (Math.random() - 0.5) * 2.5;
          vy = (vy - 2 * dot * ny) * friction + Math.abs(Math.random() * 1.5);
          break;
        }
      }
      if (by >= BOARD_BOT - BALL_R) {
        by = BOARD_BOT - BALL_R;
        const sw = W / personNames.length;
        const si = Math.min(Math.floor(bx / sw), personNames.length - 1);
        drawFrame(si);
        setPlinkoWinner(si);
        setPlinkoDropping(false);
        return;
      }
      drawFrame(-1);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  useEffect(() => {
    if (page === 8) drawStaticPlinkoBoard();
  }, [page, confirmedPax]);

  useEffect(() => {
    if (page === 9) startBoxGame();
  }, [page, confirmedPax]);

  const goBack = () => {
    if (page === 3 || page === 4 || page === 5) {
      setPage(2);
    } else if (page === 6 || page === 7) {
      setPage(3);
    } else if (page === 8) {
      setPage(3);
    } else if (page === 9) {
      setPage(3);
    } else if (page === 2) {
      setPage(1);
    }
  };

  return (
    <div className={`App ${page === 9 ? 'scrollable' : ''}`}>
      <div className="Title">
        <h1>ExpeSplit</h1>
      </div>

      <div className="content">

        {/* Page 1 — Pax input & Name Entry */}
        {page === 1 && (
  <div className="inputPax">
    <label>How many people? </label>
    <br />
    <label className="paxCondition">(Must be more than 1 person)</label>
    <br /><br />
    <input
      className="paxNum"
      type="number"
      placeholder='Enter number of pax...'
      value={pax === 0 ? '' : pax}
      onChange={(e) => setPax(Number(e.target.value))}
    />
    <br />
    <button
      className={`EnterButton ${sufficientPax ? 'active' : 'inactive'}`}
      disabled={!sufficientPax}
      onClick={() => { 
        setConfirmedPax(pax); 
        setNames(Array(pax).fill(""));
        setPage(1.5);
      }}
    >
      <label>Next</label>
    </button>
  </div>
)}

{/* Page 1.5 — Name Entry */}
{page === 1.5 && (
  <div className="nameEntryPage">
    <h2 className="optionLabel">Enter Names</h2>
    <div className="namesGrid">
      {names.map((name, index) => (
        <div key={index} className="nameInputGroup">
          <label>Person {index + 1}: </label>
          <input 
            type="text" 
            placeholder={`Name for P${index + 1}`}
            value={name}
            onChange={(e) => {
              const newNames = [...names];
              newNames[index] = e.target.value;
              setNames(newNames);
            }}
          />
        </div>
      ))}
    </div>
    <button className="EnterButton active" onClick={() => setPage(2)}>Proceed</button>
    <button className="prevPage" onClick={() => setPage(1)}>Back</button>
  </div>
)}

        {/* Page 2 — Expense type */}
        {page === 2 && (
          <div className="optionsPage">
            <h2 className="optionLabel">Choose an expense type.</h2>
            <div className="optionButtons">
              <button className="optionButton1" onClick={() => setPage(3)}>Meal</button>
              <button className="optionButton2" onClick={() => setPage(4)}>Vacation</button>
              <button className="optionButton3" onClick={() => setPage(5)}>Carpooling</button>
            </div>
            <button className="prevPage" onClick={goBack}>Back</button>
          </div>
        )}

        {/* Page 3 — Meal options */}
        {page === 3 && (
          <div className="mealOptions">
            <label className="mealLabel">Choose an option.</label>
            <button className="sharedMealButton" onClick={() => setPage(6)}>Shared Meal</button>
            <button className='separatedMealButton' onClick={() => setPage(7)}>Separated Meal</button>
            <button className='onTheHouseButton' onClick={() => setPage(9)}>On The House</button>
            <button className="prevPage" onClick={goBack}>Back</button>
          </div>
        )}

        {/* Page 4 — Vacation */}
        {page === 4 && (
          <div className="vacationPage">
            <h2 className="optionLabel">Vacation Activities</h2>
            <div className="vacationLayout">
              <div className="listOfActivities">
                <div className="activityList">
                  <div className="activityHeader">
                    <span className="col-id">#</span>
                    <span className="col-name">Activity</span>
                    <span className="col-cost">Cost</span>
                  </div>
                  <div className="activityItemsContainer">
                    {activities.map((item, index) => (
                      <div key={item.id} className="activityRow">
                        <span className="col-id">{index + 1}</span>
                        <span className="col-name">{item.name}</span>
                        <span className="col-cost">RM{item.cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="calculateVacationCost">
                <div className="activityCostForm">
                  <input
                    className="nameOfActivity"
                    placeholder="Activity Name (e.g. Flight)"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                  />
                  <input
                    className="activityCost"
                    type="number"
                    placeholder="Cost"
                    value={activityCost === 0 ? '' : activityCost}
                    onChange={(e) => setActivityCost(Number(e.target.value))}
                  />
                  <button className="addActivityButton" onClick={addActivity}>Add Activity</button>
                </div>
                <div className="resultBox">
                  <h3>Total: RM{totalVacationCost.toFixed(2)}</h3>
                </div>
                <div className="sharedCost">
                  <h3>Each person ({confirmedPax} pax): RM{(totalVacationCost / confirmedPax).toFixed(2)}</h3>
                </div>
              </div>
            </div>
            <button className="resetCostButton" onClick={resetVacationList}>Reset</button>
            <button className="vacationPrevPage" onClick={goBack}>Back</button>
          </div>
        )}

        {/* Page 5 — Carpooling */}
        {page === 5 && (
          <div className="carpooling">
            <h1 className="carpoolLabel">Carpooling</h1>
            <div className="carpoolContainer">
              <div className="carpoolInputs">
                <div className="getDistanceInput">
                  <label className='distanceLabel'>Total Distance (KM):</label>
                  <input
                    type="number"
                    className="distanceInput"
                    placeholder="e.g. 150"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={distance === 0 ? '' : distance}
                    onChange={(e) => { const val = Number(e.target.value); setDistance(val < 0 ? 0 : val); }}
                  />
                </div>
                <div className="rate">
                  <div className="rateCalculation">
                    <label>Rate (RM/KM):</label>
                    <input
                      type="number"
                      className="rateInput"
                      placeholder='e.g. 0.6'
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={ratePerKm === 0 ? '' : ratePerKm}
                      onChange={(e) => { const val = Number(e.target.value); setRatePerKm(val < 0 ? 0 : val); }}
                    />
                  </div>
                  <div className="inputSubGroup">
                    <label className="tollLabel">Tolls (RM):</label>
                    <input
                      type="number"
                      className="tollInput"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={tollCost === 0 ? '' : tollCost}
                      onChange={(e) => { const val = Number(e.target.value); setTollCost(val < 0 ? 0 : val); }}
                    />
                  </div>
                </div>
                <div className="driverToggle">
                  <label className="switchLabel">
                    <input
                      type="checkbox"
                      className="driverPay"
                      checked={driverSplitsAll}
                      onChange={() => setDriverSplitsAll(!driverSplitsAll)}
                    />
                    Driver pays too?
                  </label>
                </div>
              </div>
              <div className="carpoolSummary">
                <div className="petrolPreview">
                  <span>Est. Petrol Cost:</span>
                  <strong>RM{calculatedPetrol.toFixed(2)}</strong>
                </div>
                <div className="carpoolResults">
                  <div className="resultCard passengerCard">
                    <small>Passenger Total</small>
                    <h2>RM{finalPassenger.toFixed(2)}</h2>
                  </div>
                  <div className="resultCard driverCard">
                    <small>Driver Total</small>
                    <h2>RM{finalDriver.toFixed(2)}</h2>
                  </div>
                </div>
              </div>
            </div>
            <button className="prevPage" onClick={goBack}>Back</button>
          </div>
        )}

        {/* Page 6 — Shared Meal */}
        {page === 6 && (
          <div className="sharedMealPage">
            <h1 className="sharedMealLabel">Shared Meal</h1>
            <div className="receiptGuide">
              <div className="receiptContent">
                <p className="receiptHeader">RESTAURANT RECEIPT</p>
                <div className="receiptLines">
                  <p>Nasi Lemak Ayam ... RM 14.50</p>
                  <p>Teh Tarik (Iced) ... RM 3.50</p>
                  <p>SST (6%) ........... RM 1.08</p>
                </div>
                <div className="circledTotal">
                  <div className="receiptTotalLine">
                    <span>GRAND TOTAL:</span>
                    <span>RM 19.08</span>
                  </div>
                </div>
              </div>
              <p className="guideText">Enter the circled amount below!</p>
            </div>
            <div className="calculateSharedMeal">
              <input
                className="sharedMealInput"
                placeholder="Total Amount (*Included Tax)"
                value={totalSharedMeal === 0 ? '' : totalSharedMeal}
                onChange={(e) => setTotalSharedMeal(Number(e.target.value))}
              />
            </div>
            <div className="numberOfPax">
              <p>Number of Pax: ({confirmedPax})</p>
            </div>
            <div className="sharedCostPerPax">
              <p>Cost Per Pax: RM{sharedMealSplit.toFixed(2)}</p>
            </div>
            <button className="prevPage" onClick={goBack}>Back</button>
          </div>
        )}

        {/* Page 7 — Separated Meal (Excel Layout) */}
        {page === 7 && (
          <div className="sepMealPage">
            <h2 className="sepMealTitle">Separated Meal</h2>

            <div className="sepMealForm">
              <input
                className="sepDishNameInput"
                placeholder="Dish name"
                value={newDishName}
                onChange={e => setNewDishName(e.target.value)}
              />
              <input
                className="sepDishPriceInput"
                type="number"
                placeholder="Price (RM)"
                value={newDishPrice === 0 ? '' : newDishPrice}
                onChange={e => setNewDishPrice(Number(e.target.value))}
              />
              <button className="sepAddDishBtn" onClick={addDish}>+ Add Dish</button>
            </div>

            <div className="sepChargesRow">
              <label>Service Charge
                <input
                  type="number"
                  className="sepChargeInput"
                  value={serviceChargePercent}
                  onChange={e => setServiceChargePercent(Number(e.target.value))}
                />%
              </label>
              <label>Tax
                <input
                  type="number"
                  className="sepChargeInput"
                  value={taxPercent}
                  onChange={e => setTaxPercent(Number(e.target.value))}
                />%
              </label>
              <label>Discount (RM)
                <input
                  type="number"
                  className="sepChargeInput"
                  value={discountAmount === 0 ? '' : discountAmount}
                  placeholder="0"
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                />
              </label>
            </div>

            <div className="sepTableWrapper">
              <table className="sepTable">
                <thead>
                  <tr className="excelTopRow">
                    <td className="excelLabel"></td>
                    <td className="excelPrice"><strong>Actual Bill</strong></td>
                    {personNames.map(p => <th key={p} className="sepThPerson">{p}</th>)}
                    <th></th>
                  </tr>
                  
                  <tr className="excelHeaderRow">
                    <td className="excelLabel"><strong>Dish</strong></td>
                    <td className="excelPrice"><strong>Price</strong></td>
                    {personNames.map(p => <th key={p} className="sepSubheader">Split %</th>)}
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {dishes.map(dish => (
                    <tr key={dish.id} className="sepDishRow">
                      <td className="excelLabel">{dish.name}</td>
                      <td className="excelPrice">RM{dish.price.toFixed(2)}</td>
                      {personNames.map(p => (
                        <td key={p} className="sepTdSplit">
                          <input
                            type="number"
                            className="sepSplitInput"
                            value={dish.splits[p] === 0 ? '' : dish.splits[p]}
                            onChange={e => updateSplit(dish.id, p, Number(e.target.value))}
                          />
                          <span className="sepPct">%</span>
                        </td>
                      ))}
                      <td>
                        <button className="sepRemoveBtn" onClick={() => removeDish(dish.id)}>✕</button>
                      </td>
                    </tr>
                  ))}

                  <tr className="excelSubtotalRow">
                    <td className="excelLabel"><strong>Subtotal</strong></td>
                    <td className="excelPrice"><strong>RM{dishes.reduce((s, d) => s + d.price, 0).toFixed(2)}</strong></td>
                    {personNames.map(p => (
                      <td key={p} className="sepTdTotal">RM{getPersonSubtotal(p).toFixed(2)}</td>
                    ))}
                    <td></td>
                  </tr>

                  <tr className="excelChargeRow">
                    <td className="excelLabel">Service Charge ({serviceChargePercent}%)</td>
                    <td className="excelPrice">RM{(dishes.reduce((s, d) => s + d.price, 0) * serviceChargePercent / 100).toFixed(2)}</td>
                    {personNames.map(p => (
                      <td key={p} className="sepTdTotal">
                        RM{(getPersonSubtotal(p) * serviceChargePercent / 100).toFixed(2)}
                      </td>
                    ))}
                    <td></td>
                  </tr>

                  <tr className="excelChargeRow">
                    <td className="excelLabel">Tax ({taxPercent}%)</td>
                    <td className="excelPrice">RM{(dishes.reduce((s, d) => s + d.price, 0) * taxPercent / 100).toFixed(2)}</td>
                    {personNames.map(p => (
                      <td key={p} className="sepTdTotal">
                        RM{(getPersonSubtotal(p) * taxPercent / 100).toFixed(2)}
                      </td>
                    ))}
                    <td></td>
                  </tr>

                  <tr className="excelChargeRow">
                    <td className="excelLabel">Discount (−RM{discountAmount.toFixed(2)})</td>
                    <td className="excelPrice">RM{discountAmount.toFixed(2)}</td>
                    {personNames.map(p => (
                      <td key={p} className="sepTdTotal">
                        −RM{(confirmedPax > 0 ? discountAmount / confirmedPax : 0).toFixed(2)}
                      </td>
                    ))}
                    <td></td>
                  </tr>

                  <tr className="sepTotalRow">
                  <td className="excelLabel"><strong>Total</strong></td>
                  <td className="excelPrice">
                    <strong>RM{(dishes.reduce((s, d) => s + d.price, 0) * (1 + (serviceChargePercent + taxPercent) / 100) - discountAmount).toFixed(2)}</strong>
                  </td>
                  {personNames.map(p => (
                    <td key={p} className="sepTdGrandTotal">
                      RM{getPersonTotal(p).toFixed(2)}
                    </td>
                  ))}
                  <td></td>
                </tr>
              </tbody>
                
                <tr className="sepGrandTotalRow">
                  <td colSpan={2} className="excelLabel"><strong>GRAND TOTAL (ALL PAX)</strong></td>
                  <td colSpan={confirmedPax} className="sepTdFullTotal">
                    <strong>RM{getGrandTotal().toFixed(2)}</strong>
                  </td>
                  <td></td>
                </tr>
              </table>
            </div>

            <div className="sepMealActions">
              <button className="sepResetBtn" onClick={resetSeparatedMeal}>Reset</button>
              <button className="prevPage" onClick={goBack}>Back</button>
            </div>
          </div>
        )}

        {/* Page 8 — Plinko */}
        {page === 8 && (
          <div className="plinkoPage">
            <div className="plinkoHeaderArea">
              <h2 className="plinkoHeader">Welcome to the Plinko Game!</h2>
              <p className="plinkoSubtitle">Click the "Drop" button to see who's on the house!</p>
            </div>
            <div className="plinkoStage">
              <canvas
                ref={plinkoCanvasRef}
                width={300}
                height={420}
                className="plinkoCanvas"
              />
            </div>
            <div className="plinkoControlsArea">
              <button
                className="dropBtn"
                onClick={() => { drawStaticPlinkoBoard(); playPlinko(); }}
                disabled={plinkoDropping}
              >
                {plinkoDropping ? 'Dropping...' : 'DROP BALL'}
              </button>
              {plinkoWinner !== null && (
                <div className="winAnnounce">
                  <h3>BAD LUCK!</h3>
                  <h1>{personNames[plinkoWinner]} pays the bill!</h1>
                </div>
              )}
              <button className="prevPage" onClick={goBack}>Back</button>
            </div>
          </div>
        )}

        {/* Page 9 — Mystery Box Picker */}
        {page === 9 && (
          <div className="boxPickerPage">
            <div className="boxPickerHeader">
              <h2 className="boxPickerTitle">Mystery boxes! 🎁</h2>
              <p className="boxPickerSubtitle">
                {boxAssignments.length < confirmedPax
                  ? <>{personNames[currentPickerIdx] || "Someone"} — pick a mystery box!</>
                  : "All players assigned!"}
              </p>
            </div>

            <div className="boxGrid">
              {Array.from({ length: confirmedPax }, (_, i) => {
                const isTaken = takenBoxes.includes(i);
                const isRevealed = revealedBox === i;

                const pNumber = `P${shuffledPlayers[i]}`; 

                return (
                  <div
                    key={i}
                    className={`mysteryBox ${isTaken ? 'boxTaken' : ''} ${isRevealed ? 'boxRevealed' : ''}`}
                    onClick={() => pickBox(i)}
                  >
                    {isRevealed ? (
                      <>
                        <span className="boxIcon">✨</span>
                        <span className="boxPlayerNum">{pNumber}</span>
                      </>
                    ) : isTaken ? (
                      <span className="boxTakenLabel">{pNumber}</span>
                    ) : (
                      <>
                        <span className="boxIcon">🎁</span>
                        <span className="boxSubLabel">Box {i + 1}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

{boxAssignments.length > 0 && (
  <div className="assignmentList">
    {boxAssignments.map((a, idx) => (
      <div key={idx} className="assignmentRow">
        <span className="assignPerson">{a.picker}</span>
        <span className="assignArrow">→</span>
        <span className="assignPlayer">P{a.player}</span>
      </div>
    ))}
  </div>
)}

            <div className="boxPickerActions">
              <div className="boxPickerLeft">
                <button className="resetBoxBtn" onClick={startBoxGame}>Reshuffle</button>
                <button className="prevPage" onClick={goBack}>Back</button>
              </div>
              {boxAssignments.length === confirmedPax && (
                <button className="goToPlinkoBtn" onClick={() => setPage(8)}>
                  Next
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
