import { useEffect, useState } from "react";
import "./App.css";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

type CheeseEvent = {
  cheeser: string;
  cheesee: string;
  time: Date;
};

type AggreatedCheeses = {
  [key: string]: number;
};

function App() {
  const [cheeser, setCheeser] = useState("");
  const [cheeses, setCheeses] = useState([]);

  useEffect(() => {
    fetchNerdsThatGotRekt();
  }, []);

  const fetchNerdsThatGotRekt = () => {
    fetch("http://localhost:3000/cheese")
      .then((resp) => resp.json())
      .then((data) => setCheeses(data));
  };

  const commenceCheesening = async () => {
    await fetch("http://localhost:3000/cheese", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cheeser: cheeser }),
    });
    fetchNerdsThatGotRekt();
  };

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Input
          type="cheeser"
          placeholder="joe"
          value={cheeser}
          onChange={(e) => setCheeser(e.target.value)}
        />
        <Button onClick={commenceCheesening}>CHEESE</Button>
        {Object.entries(
          cheeses.reduce((accumulator: AggreatedCheeses, val: CheeseEvent) => {
            accumulator[val.cheeser] = (accumulator[val.cheeser] || 0) + 1;
            accumulator[val.cheesee] = (accumulator[val.cheesee] || 0) - 1;

            return accumulator;
          }, {})
        )
          .sort((a, b) => b[1] - a[1])
          .map(([rekt, rektCount]) => {
            return (
              <Card key={rekt}>
                <CardHeader>
                  <CardTitle>{rekt}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{rektCount}</p>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

export default App;
