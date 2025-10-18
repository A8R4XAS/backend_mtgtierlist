/**
 * Script zur Generierung von Testdaten für alle Tabellen
 * Erstellt jeweils maximal 5 Einträge pro Tabelle
 * 
 * Usage: npm run generate-testdata
 */

import { dataSource } from '../db';
import { User, UserRole } from '../app/entities/user.entity';
import { Game } from '../app/entities/game.entity';
import { Deck } from '../app/entities/deck.entity';
import { Rating } from '../app/entities/rating_participation.entity';
import { Participation } from '../app/entities/participation.entity';
import { User_deck } from '../app/entities/user_deck.entity';
import { hashPassword } from '@foal/core';

/**
 * Hauptfunktion zur Generierung aller Testdaten
 */
async function generateTestData() {
    try {
        console.log('🚀 Starte Testdaten-Generierung...');
        
        // Initialisiere Datenbankverbindung
        if (!dataSource.isInitialized) {
            await dataSource.initialize();
            console.log('✅ Datenbankverbindung hergestellt');
        }

        // Lösche bestehende Daten (in umgekehrter Reihenfolge wegen Foreign Keys)
        console.log('🗑️ Lösche bestehende Daten...');
        await dataSource.getRepository(Rating).deleteAll();
        await dataSource.getRepository(Participation).deleteAll();
        await dataSource.getRepository(User_deck).deleteAll();
        await dataSource.getRepository(Deck).deleteAll();
        await dataSource.getRepository(Game).deleteAll();
        await dataSource.getRepository(User).deleteAll();

        // Erstelle Testdaten in der richtigen Reihenfolge
        const users = await createTestUsers();
        console.log(`✅ ${users.length} Benutzer erstellt`);

        const games = await createTestGames();
        console.log(`✅ ${games.length} Spiele erstellt`);

        const decks = await createTestDecks(users);
        console.log(`✅ ${decks.length} Decks erstellt`);

        const userDecks = await createTestUserDecks(users, decks);
        console.log(`✅ ${userDecks.length} Benutzer-Deck-Zuordnungen erstellt`);

        const participations = await createTestParticipations(games, userDecks);
        console.log(`✅ ${participations.length} Teilnahmen erstellt`);

        const ratings = await createTestRatings(participations, users);
        console.log(`✅ ${ratings.length} Bewertungen erstellt`);

        console.log('🎉 Testdaten-Generierung erfolgreich abgeschlossen!');
        console.log('\n📊 Zusammenfassung:');
        console.log(`- Benutzer: ${users.length}`);
        console.log(`- Spiele: ${games.length}`);
        console.log(`- Decks: ${decks.length}`);
        console.log(`- Benutzer-Deck-Zuordnungen: ${userDecks.length}`);
        console.log(`- Teilnahmen: ${participations.length}`);
        console.log(`- Bewertungen: ${ratings.length}`);

    } catch (error) {
        console.error('❌ Fehler bei der Testdaten-Generierung:', error);
        throw error;
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
            console.log('📋 Datenbankverbindung geschlossen');
        }
    }
}

/**
 * Erstellt 5 Test-Benutzer mit verschiedenen Rollen
 */
async function createTestUsers(): Promise<User[]> {
    const userRepo = dataSource.getRepository(User);
    
    const testUsers = [
        { email: 'admin@mtg-tierlist.com', password: 'admin123', name: 'Administrator', role: UserRole.ADMIN },
        { email: 'moderator@mtg-tierlist.com', password: 'mod123', name: 'Moderator', role: UserRole.ADMIN },
        { email: 'alice@mtg-tierlist.com', password: 'alice123', name: 'Alice Commander', role: UserRole.USER },
        { email: 'bob@mtg-tierlist.com', password: 'bob123', name: 'Bob Planeswalker', role: UserRole.USER },
        { email: 'charlie@mtg-tierlist.com', password: 'charlie123', name: 'Charlie Artificer', role: UserRole.USER }
    ];

    const users: User[] = [];
    for (const userData of testUsers) {
        userData.password = await hashPassword(userData.password);
        const user = userRepo.create(userData);
        const savedUser = await userRepo.save(user);
        users.push(savedUser);
    }

    return users;
}

/**
 * Erstellt 5 Test-Spiele mit verschiedenen Zeitstempeln
 */
async function createTestGames(): Promise<Game[]> {
    const gameRepo = dataSource.getRepository(Game);
    
    const games: Game[] = [];
    for (let i = 1; i <= 5; i++) {
        const game = gameRepo.create({
            createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)) // i Tage in der Vergangenheit
        });
        const savedGame = await gameRepo.save(game);
        games.push(savedGame);
    }

    return games;
}

/**
 * Erstellt 5 Test-Decks mit verschiedenen Commandern und Themen
 */
async function createTestDecks(users: User[]): Promise<Deck[]> {
    const deckRepo = dataSource.getRepository(Deck);
    
    const testDecks = [
        {
            owner: users[0],  // Verwende das komplette User-Objekt
            commander: 'Atraxa, Praetors\' Voice',
            thema: 'Superfriends',
            gameplan: 'Control the board with planeswalkers',
            tempo: 'Midrange',
            tier: 2,
            weaknesses: 'Vulnerable to board wipes'
        },
        {
            owner: users[1],
            commander: 'Edgar Markov',
            thema: 'Vampire Tribal',
            gameplan: 'Aggressive creature swarm',
            tempo: 'Aggro',
            tier: 1,
            weaknesses: 'Relies on creature synergy'
        },
        {
            owner: users[2],
            commander: 'Meren of Clan Nel Toth',
            thema: 'Graveyard Value',
            gameplan: 'Recurring creatures for value',
            tempo: 'Midrange',
            tier: 2,
            weaknesses: 'Graveyard hate'
        },
        {
            owner: users[3],
            commander: 'Azami, Lady of Scrolls',
            thema: 'Wizard Tribal',
            gameplan: 'Draw cards and counter spells',
            tempo: 'Control',
            tier: 3,
            weaknesses: 'Slow start'
        },
        {
            owner: users[4],
            commander: 'Krenko, Mob Boss',
            thema: 'Goblin Tribal',
            gameplan: 'Fast aggro with token generation',
            tempo: 'Aggro',
            tier: 1,
            weaknesses: 'Board wipes'
        }
    ];

    const decks: Deck[] = [];
    for (const deckData of testDecks) {
        const deck = deckRepo.create(deckData);
        const savedDeck = await deckRepo.save(deck);
        decks.push(savedDeck);
    }

    return decks;
}

/**
 * Erstellt Benutzer-Deck-Zuordnungen (welcher User hat mit welchem Deck gespielt)
 * Erstellt verschiedene Kombinationen - auch Users die mit fremden Decks spielen
 */
async function createTestUserDecks(users: User[], decks: Deck[]): Promise<User_deck[]> {
    const userDeckRepo = dataSource.getRepository(User_deck);
    
    const userDecks: User_deck[] = [];
    
    // Erstelle interessante Kombinationen von Spielern und Decks
    const combinations = [
        // Jeder spielt erstmal mit seinem eigenen Deck
        { user: users[0], deck: decks[0] },
        { user: users[1], deck: decks[1] },
        { user: users[2], deck: decks[2] },
        { user: users[3], deck: decks[3] },
        { user: users[4], deck: decks[4] },
        
        // Dann ein paar Cross-Kombinationen (User spielt mit fremdem Deck)
        { user: users[0], deck: decks[1] }, // Admin spielt mit Edgar Markov
        { user: users[1], deck: decks[2] }, // Moderator spielt mit Meren
        { user: users[2], deck: decks[3] }, // Alice spielt mit Azami
        { user: users[3], deck: decks[4] }, // Bob spielt mit Krenko
        { user: users[4], deck: decks[0] }  // Charlie spielt mit Atraxa
    ];
    
    for (const combo of combinations) {
        console.log(`Creating user_deck: ${combo.user.name} spielt mit ${combo.deck.commander}`);
        
        const userDeck = userDeckRepo.create({
            user: combo.user,  // Verwende das komplette User-Objekt
            deck: combo.deck   // Verwende das komplette Deck-Objekt
        });
        
        try {
            const savedUserDeck = await userDeckRepo.save(userDeck);
            userDecks.push(savedUserDeck);
            console.log(`✅ Created user_deck with id=${savedUserDeck.id}`);
        } catch (error) {
            // Ignoriere Duplikate falls @Unique constraint verletzt wird
            console.log(`⚠️ User_deck combination übersprungen (Duplikat): ${combo.user.name} + ${combo.deck.commander}`);
        }
    }

    return userDecks;
}

/**
 * Erstellt 5 Test-Teilnahmen für verschiedene Spiele
 */
async function createTestParticipations(games: Game[], userDecks: User_deck[]): Promise<Participation[]> {
    const participationRepo = dataSource.getRepository(Participation);
    
    const participations: Participation[] = [];
    
    // Erstelle für jedes Spiel eine zufällige Anzahl von Teilnehmern (2-4)
    for (const game of games) {
        const numParticipants = Math.floor(Math.random() * 3) + 2; // 2-4 Teilnehmer
        const selectedUserDecks = userDecks.slice(0, numParticipants);
        
        for (let i = 0; i < selectedUserDecks.length; i++) {
            const participation = participationRepo.create({
                game: game,
                user_deck: selectedUserDecks[i],
                is_winner: i === 0 // Der erste Teilnehmer gewinnt
            });
            const savedParticipation = await participationRepo.save(participation);
            participations.push(savedParticipation);
        }
    }

    return participations;
}

/**
 * Erstellt Test-Bewertungen für die Teilnahmen
 */
async function createTestRatings(participations: Participation[], users: User[]): Promise<Rating[]> {
    const ratingRepo = dataSource.getRepository(Rating);
    
    const ratings: Rating[] = [];
    
    // Erstelle für jede Teilnahme 1-3 zufällige Bewertungen
    for (const participation of participations) {
        const numRatings = Math.floor(Math.random() * 3) + 1; // 1-3 Bewertungen
        
        for (let i = 0; i < numRatings && i < users.length; i++) {
            // Verhindere Selbstbewertung
            const rater = users[i];
            
            const rating = ratingRepo.create({
                participation: participation,
                rater: rater,
                value: Math.floor(Math.random() * 5) + 1 // Bewertung von 1-5
            });
            
            try {
                const savedRating = await ratingRepo.save(rating);
                ratings.push(savedRating);
            } catch (error) {
                // Ignoriere Duplikate (falls Unique Constraint verletzt wird)
                console.log(`⚠️ Bewertung übersprungen (möglicherweise Duplikat): ${handleError(error)}`);
            }
        }
    }

    return ratings;
}

/**
 * Hilfsfunktion für Fehlerbehandlung
 */
function handleError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

/**
 * Main-Funktion für FoalTS Shell Scripts
 * Diese Funktion wird von FoalTS automatisch aufgerufen
 */
export async function main() {
    try {
        await generateTestData();
        console.log('✨ Script erfolgreich beendet');
    } catch (error) {
        console.error('💥 Script fehlgeschlagen:', handleError(error));
        throw error;
    }
}

export { generateTestData };