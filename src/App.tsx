import { useState, useRef, useEffect } from 'react'
import './App.css'


function App() {
  // Set and change pages
  const [page, setPage] = useState<number>(1);

  // Confirming pax number
  const [pax, setPax] = useState<number>(0);
  const sufficientPax = pax >= 2;
  const [confirmedPax, setConfirmedPax] = useState<number>(0);

  // List of activities with their own costs
  const [activities, setActivities] = useState<{id: number, name: string, cost: number}[]>([]);
  const [activityName, setActivityName] = useState("");
  const [activityCost, setActivityCost] = useState(0);

  // Shared meal splitting
  const [totalSharedMeal, setTotalSharedMeal] = useState<number>(0);
  const sharedMealSplit = confirmedPax > 1 ? totalSharedMeal / confirmedPax : 0;

  // Separated Meals
  const [mealItems, setMealItems] = useState<{id: number, name: string, cost: number}[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState(0);

  // Taxes
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [mealTaxPercent, setMealTaxPercent] = useState<number>(16);

  // Alcohol price and number of people drinking
  const [drinkTotal, setDrinkTotal] = useState(0);
  const [drinkerPax, setDrinkerPax] = useState(0);

  // Carpool Distance States
  const [distance, setDistance] = useState<number>(0);
  const [ratePerKm, setRatePerKm] = useState<number>(0); // Default RM 0.60/km
  const [tollCost, setTollCost] = useState<number>(0);
  const [driverSplitsAll, setDriverSplitsAll] = useState<boolean>(true);

  // Math Logic
  const calculatedPetrol = distance * ratePerKm;
  const totalTripCost = calculatedPetrol + tollCost;

  // Shares
  const perPaxShare = confirmedPax > 0 ? totalTripCost / confirmedPax : 0;
  const passengerOnlyShare = (confirmedPax > 1) ? totalTripCost / (confirmedPax - 1) : totalTripCost;

  const finalPassenger = driverSplitsAll ? perPaxShare : passengerOnlyShare;
  const finalDriver = driverSplitsAll ? perPaxShare : 0; // Driver pays 0 if passengers cover them

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

  const resetSeparatedMeal = () => {
    setMealItems([]);
    setItemName("");
    setItemCost(0);
  }
  const addMealItem = () => {
    if (itemName && itemCost > 0) {
      setMealItems([...mealItems, { id: Date.now(), name: itemName, cost: itemCost }]);
      setItemName("");
      setItemCost(0);
    }
  };

const [boxAssignments, setBoxAssignments] = useState<{picker: number, player: number}[]>([]);
const [currentPicker, setCurrentPicker] = useState(1);
const [shuffledPlayers, setShuffledPlayers] = useState<number[]>([]);
const [revealedBox, setRevealedBox] = useState<number | null>(null);
const [takenBoxes, setTakenBoxes] = useState<number[]>([]);

const startBoxGame = () => {
  const arr = Array.from({ length: confirmedPax }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  setShuffledPlayers(arr);
  setBoxAssignments([]);
  setCurrentPicker(1);
  setRevealedBox(null);
  setTakenBoxes([]);
};

const pickBox = (i: number) => {
  if (takenBoxes.includes(i) || revealedBox !== null) return;
  const playerNum = shuffledPlayers[i];
  setRevealedBox(i);
  setTimeout(() => {
    setBoxAssignments(prev => [...prev, { picker: currentPicker, player: playerNum }]);
    setTakenBoxes(prev => [...prev, i]);
    setRevealedBox(null);
    setCurrentPicker(prev => prev + 1);
  }, 1800);
};

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
  const slotLabels = Array.from({ length: confirmedPax }, (_, i) => `P${i + 1}`);
  const sw = W / slotLabels.length;
  slotLabels.forEach((label, i) => {
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

// Plinko Physics
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
  const slotLabels = Array.from({ length: confirmedPax }, (_, i) => `P${i + 1}`);
  let bx = W / 2 + (Math.random() - 0.5) * 8;
  let by = BOARD_TOP + 8;
  let vx = (Math.random() - 0.5) * 1.5;
  let vy = 1.2;
  const gravity = 0.05, friction = 0.80;
  const drawFrame = (landedSlot: number) => {
    ctx.clearRect(0, 0, W, H);
    const sw = W / slotLabels.length;
    slotLabels.forEach((label, i) => {
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
      const sw = W / slotLabels.length;
      const si = Math.min(Math.floor(bx / sw), slotLabels.length - 1);
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

  // Tax cost
  const taxMultiplier = taxIncluded ? 1 : 1 + (mealTaxPercent / 100);

  // 2. Individual Drink Share
  const individualDrinkShare = drinkerPax > 0 
    ? (drinkTotal / drinkerPax) * taxMultiplier 
    : 0;

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
      <div className="App">
        <div className="Title">
        <h1>ExpeSplit</h1>
      </div>

      <div className="content">

        {/* Confirm pax pumber page */}
        {page === 1 && (
        <div className="inputPax">
          <label>How many people? </label>
          <br></br>
          <label className="paxCondition">(Must be more than 1 person)</label>
          <br></br>
          <br></br>
          <input 
            className="paxNum" 
            type="number"
            placeholder='Enter number of pax...'
            value={pax === 0 ? '' : pax}
            onChange={(e) => setPax(Number(e.target.value))} 
          />
          <br></br>
          <button className={`EnterButton ${sufficientPax ? 'active' : 'inactive'}`}
          disabled={!sufficientPax}
          onClick={() => {setConfirmedPax(pax)
            setPage(2);
          }}>
            <label>Enter</label>
          </button>
        </div>
        )}
        
        {/* Expenses page */}
        {page === 2 && (
          <div className="optionsPage">
            <h2 className="optionLabel">Choose an expense type.</h2>
            <div className="optionButtons">
              <button className="optionButton1"
              onClick={() => setPage(3)}>
                Meal</button>
              <button className="optionButton2"
              onClick={() => setPage(4)}>
                Vacation</button>
              <button className="optionButton3"
              onClick={() => {setPage(5)}}>
                Carpooling</button>
            </div>
            <button className="prevPage" onClick={(goBack)}>
              Back
            </button>
          </div>
        )}

        {/* Meals page */}
        {page == 3 && (
          <div className="mealOptions">
          <label className="mealLabel">Choose an option.</label>
          <button className="sharedMealButton" onClick={() => setPage(6)}>
            Shared Meal</button>
            <button className='separatedMealButton' onClick={() => setPage(7)}>
              Separated Meal
            </button>
            <button className='onTheHouseButton' onClick={() => setPage(9)}>
              On The House
            </button>
          <button className="prevPage" onClick={(goBack)}>
              Back
              </button>
          </div>
        )}

        {/* Vacation page */}
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
    <button className=" resetCostButton" onClick={resetVacationList}>
      Reset
    </button>
    <button className="vacationPrevPage" onClick={(goBack)}>
              Back
      </button>
  </div>
)}

        {/* Carpooling page */}
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
                    // Prevent scrolling from changing value
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    value={distance === 0 ? '' : distance}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      // Force positive numbers only
                      setDistance(val < 0 ? 0 : val);
                    }}
                  />
                </div>

                <div className="rate">
                  <div className="rateCalculation">
                    <label>Rate (RM/KM):</label>
                    <input 
                      type="number" 
                      className="rateInput"
                      placeholder='e.g.  .6 (0.6)'
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={ratePerKm === 0 ? '' : ratePerKm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRatePerKm(val < 0 ? 0 : val);
                      }}
                    />
                  </div>
                  <div className="inputSubGroup">
                    <label className="tollLabel">Tolls (RM):</label>
                    <input 
                      type="number" 
                      className="tollInput"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      value={tollCost === 0 ? '' : tollCost}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTollCost(val < 0 ? 0 : val);
                      }}
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

    {/* Shared Meal Page */}
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
                <input className="sharedMealInput"
                placeholder="Total Amount (*Included Tax)"
                value={totalSharedMeal === 0 ? '' : totalSharedMeal}
                onChange={(e) => setTotalSharedMeal(Number(e.target.value))}>
                </input>
                </div>
                <div className="numberOfPax">
                  <p>Number of Pax: ({confirmedPax})</p>
                  </div>
                  <div className="sharedCostPerPax">
                  <p>Cost Per Pax: RM{(sharedMealSplit).toFixed(2)}</p>
                  </div>
              <button className="prevPage" onClick={(goBack)}>
              Back
              </button>
            </div>
        )}

    {page === 7 && (
      <div className="separatedMealPage">
        <h2 className="mealHeader">Separated Meal</h2>
        
        <div className="mealSplitterLayout">
          <div className="foodRegistrySidebar">
            <h3 className="registryTitle">Individual Bills</h3>
            <div className="dishScrollArea">
              {mealItems.map((item) => (
                <div key={item.id} className="dishEntryRow">
                  <span className="dishIndex">{item.name}</span>
                  <span className="dishPrice">
                    RM{(item.cost * taxMultiplier).toFixed(2)}
                  </span>
                </div>
              ))}
              {drinkTotal > 0 && (
                <div className="dishEntryRow drinkHighlight">
                  <span>Drink Share (Per Person)</span>
                  <span>RM{individualDrinkShare.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mealLogicPanel">
            <div className="dishEntryForm">
              <input 
                className="dishNameInput" 
                placeholder="Person's Name / Dish" 
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <input 
                className="dishCostInput" 
                type="number" 
                placeholder="Base RM" 
                value={itemCost === 0 ? '' : itemCost}
                onChange={(e) => setItemCost(Number(e.target.value))}
              />
              <button className="addDishBtn" onClick={addMealItem}>Add to Bill</button>
            </div>

            <div className="drinkerTaxAdjuster">
              <label className="taxLabel"><strong>Tax & Service Charge (%)</strong></label>
              <div className="taxInputWrapper">
                <input 
                  type="number" 
                  className="manualTaxInput" 
                  value={mealTaxPercent === 0 ? '' : mealTaxPercent} 
                  onChange={(e) => {
                    const val = e.target.value;
                    setMealTaxPercent(val === '' ? 0 : Number(val));
                  }}
                />
                <label className="taxCheckboxLabel">
                  <input 
                    type="checkbox" 
                    checked={taxIncluded} 
                    onChange={() => setTaxIncluded(!taxIncluded)} 
                  />
                  Tax included in prices?
                </label>
              </div>
              <hr></hr>      
              <label className='alcoholLabel'>Alcohol / Shared Drinks (RM)</label>
              <input 
                type="number" 
                className="drinkCostField" 
                placeholder="0.00"
                value={drinkTotal === 0 ? '' : drinkTotal}
                onChange={(e) => {
                  const val = e.target.value;
                  setDrinkTotal(val === '' ? 0 : Number(val));
                }}
              />

              <label className="numOfDrinkersLabel">Number of Drinkers (Max {confirmedPax})</label>
              <input 
                type="number" 
                className="drinkerCountField" 
                placeholder="0"
                value={drinkerPax === 0 ? '' : drinkerPax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > confirmedPax) {
                    setDrinkerPax(confirmedPax);
                  } else {
                    setDrinkerPax(val);
                  }
                }}
              />
            </div>
          </div>
        </div>
        <button className="resetSepMealButton" onClick={resetSeparatedMeal}>
                Reset
              </button>
        <button className="prevPage" onClick={goBack}>Back</button>
      </div>
    )}

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
              <h1>Player {plinkoWinner + 1} pays the bill!</h1>
            </div>
          )}
          <button className="prevPage" onClick={goBack}>Back</button>
        </div>
      </div>
    )}

    {page === 9 && (
    <div className="boxPickerPage">
      <div className="boxPickerHeader">
        <h2 className="boxPickerTitle">Mystery boxes!🎁</h2>
        <p className="boxPickerSubtitle">
          {boxAssignments.length < confirmedPax
            ? <>Person <span className="currentPickerNum">{currentPicker}</span> — pick a mystery box!</>
            : "All players assigned!"}
        </p>
      </div>

      <div className="boxGrid">
        {Array.from({ length: confirmedPax }, (_, i) => {
          const isTaken = takenBoxes.includes(i);
          const isRevealed = revealedBox === i;
          const playerNum = shuffledPlayers[i];

          return (
            <div
              key={i}
              className={`mysteryBox ${isTaken ? 'boxTaken' : ''} ${isRevealed ? 'boxRevealed' : ''}`}
              onClick={() => pickBox(i)}
            >
              {isRevealed ? (
                <>
                  <span className="boxPlayerNum">P{playerNum}</span>
                  <span className="boxSubLabel">Person {currentPicker}</span>
                </>
              ) : isTaken ? (
                <span className="boxTakenLabel">P{playerNum}</span>
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
          {boxAssignments.map((a) => (
            <div key={a.picker} className="assignmentRow">
              <span className="assignPerson">Person {a.picker}</span>
              <span className="assignArrow">→</span>
              <span className="assignPlayer">P{a.player}</span>
            </div>
          ))}
        </div>
      )}

      <div className="boxPickerActions">
        {boxAssignments.length === confirmedPax && (
          <button className="goToPlinkoBtn" onClick={() => setPage(8)}>
            Next
          </button>
        )}
        <button className="resetBoxBtn" onClick={startBoxGame}>Reshuffle</button>
        <button className="prevPage" onClick={goBack}>Back</button>
      </div>
    </div>
  )}
      </div>
    </div>
  )
}

export default App
