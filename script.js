const leafsSchedule = [
    {   date:"2025-10-21", 
        vs:"Ottawa Senators", 
        loc:"Away", 
        time:"7:00 pm ET", 
        theme:"Preseason Game 1" 
    },
    {   date:"2025-10-23", 
        vs:"Ottawa Senators", 
        loc:"Home", 
        time:"7:00 pm ET", 
        theme:"Preseason Game 2" 
    },
    {   date:"2025-10-25", 
        vs:"Montreal Canadiens", 
        loc:"Away", 
        time:"7:00 pm ET", 
        theme:"Preseason Game 3" 
    },
    {   date:"2025-10-27", 
        vs:"Montreal Canadiens", 
        loc:"Home", 
        time:"7:00 pm ET", 
        theme:"Preseason Game 4" 
    },
    {   date:"2025-11-02", 
        vs:"Detroit Red Wings", 
        loc:"Home", 
        time:"7:00 pm ET", 
        theme:"Preseason Game 5" 
    },
    {   date:"2025-11-04", 
        vs:"Detroit Red Wings", 
        loc:"Away", 
        time:"7:00 pm ET", 
        theme:"Preseason Game 6" 
    }
];


// function to generate the calendar for Oct2025
function generateOctober2025() {
    const calendarDays = document.getElementById("calendar-days");
    calendarDays.innerHTML = ""; // clear previous

    const year = 2025;
    const month = 9;

    const firstDay = new Date(year, month, 1).getDay(); // 3 = Wednesday
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 31 days

    // empty square slots before day 1
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.classList.add("day", "empty");
        calendarDays.appendChild(emptyDiv);
    }

    // add days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayDiv = document.createElement("div");
        dayDiv.classList.add("day");
        dayDiv.innerHTML = `<strong>${day}</strong>`;

        // check if game exists on this day
        const game = leafsSchedule.find(g => {
            const gameDate = new Date(g.date);
            return gameDate.getDate() === day &&
                   gameDate.getMonth() === month &&
                   gameDate.getFullYear() === year;
        });

        if (game) {
            const gameDiv = document.createElement("div");
            gameDiv.classList.add("game");
            gameDiv.innerHTML = `
                ${game.vs} (${game.loc})<br>
                ${game.time}<br>
                ${game.theme}
            `;
            dayDiv.appendChild(gameDiv);
        }
        calendarDays.appendChild(dayDiv);
    }
}

// call the function for the calendar
generateOctober2025();