import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, InputGroup, Button, FormControl } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import SpotifyWebApi from 'spotify-web-api-js';

const spotifyAPI = new SpotifyWebApi();
const CLIENT_ID = "b59c4b8e3df247e1a530ccb87d4ffbbb";
const CLIENT_SECRET = "eaef3b021e604ea699cd6b62e2c9bf69";
const SCOPE = "user-read-private user-read-email user-top-read";
const REDIRECT_URL = "https://ethankemper.github.io/Treeify/";
const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";

const getTokenFromUrl = () => {
  return window.location.hash.substring(1).split('&').reduce((initial, item) => {
    let parts = item.split("=");
    initial[parts[0]] = decodeURIComponent(parts[1]);
    return initial;
  }, {})
}

function App() {
  const [token, setToken] = useState("");
  const [artists, setArtists] = useState([]);
  const [artistBook, setArtistBook] = useState([]);
  const [trackBook, setTrackBook] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [topSongsGenre1, setTopSongsGenre1] = useState([]);
  const [topSongsGenre2, setTopSongsGenre2] = useState([]);
  const [topSongsGenre3, setTopSongsGenre3] = useState([]);
  const [topSongsGenre4, setTopSongsGenre4] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const token = getTokenFromUrl().access_token;
    window.location.hash = "";
    if(token && !loggedIn){
      setToken(token);
      spotifyAPI.setAccessToken(token)
      setLoggedIn(true);
      setShow(true);
    }

    async function sortGenres() {
      let genres = {};
      let result = [];
    
      (artistBook.top || []).forEach((artist) => {
        artist.genres.forEach((genre) => {
          if( genres[genre] ) {
            genres[genre] += 1;
          } 
          else {
            genres[genre] = 1;
          }
        });
      });
    
      let sortedGenres = Object.keys(genres).sort((a, b) => genres[b] - genres[a]);
    
      for (const g of sortedGenres) {
        let songCount = 0;
        for (const track of (trackBook.top || [])) {
          let curArtists = track.artists;
          for (const a of (curArtists || [])) {
            let curA = await spotifyAPI.getArtist(a.id)
            let curGenres = curA.genres;
            for (const curG of (curGenres || [])) {
              if(g === curG){
                songCount++;
              }
            }
          }
        }
        if(songCount >= 2){
          result.push(g);
        }
      }
      return result;
    }

    const fetchData = async () => {
      const result = await sortGenres();
      setTopGenres(result);
    };

    if(show) {
      getTop();
      if(artistBook.top && trackBook.top){
        fetchData();
        setShow(false);
      }
    }
  }, [artistBook.top, show, trackBook.top]);

  async function getTop(){
    await spotifyAPI.getMyTopArtists({ time_range: "medium_term", limit:10 }).then((response) => {
      setArtists({
        top: response.items
      })
    })
    await spotifyAPI.getMyTopTracks({ time_range: "short_term", limit:50 }).then((response) => {
      setTrackBook({
        top: response.items
      })
    })
    await spotifyAPI.getMyTopArtists({ time_range: "medium_term", limit:50}).then((response) => {
      setArtistBook({
        top: response.items
      })
    })
  }

  useEffect(() => {
    const masterSongList = [];
    async function fetchSongsGenre(genreNum) {
      const songs = [];
      const genre = topGenres[genreNum];
      for (const track of trackBook.top || []) {
        const artists = track.artists;
        let hasGenre = false;
        for (const artist of artists) {
          const artistID = artist.id;
          const curArtist = await spotifyAPI.getArtist(artistID);
          if((curArtist.genres || []).includes(genre) && !masterSongList.includes(track)) {
            hasGenre = true;
            break;
          }
        }
          if(hasGenre) {
            songs.push(track);
            masterSongList.push(track);  // masterSongList prevents duplicates
            if (songs.length === 3) break;
          }
        }
      return songs;
    }
    fetchSongsGenre(0).then((songs) => { setTopSongsGenre1(songs); });
    fetchSongsGenre(1).then((songs) => { setTopSongsGenre2(songs); });
    fetchSongsGenre(2).then((songs) => { setTopSongsGenre3(songs); });
    fetchSongsGenre(3).then((songs) => { setTopSongsGenre4(songs); });
  }, [topGenres]);


  const renderArtists = () => {
    let red = 100;
    let green = 50;
    return (artists.top || []).map((a) => { // prints top 10 artists
      let temp = "rgb(" + red + "," + green + ",0)";
      red += 11;
      green += 6;
      return(
        <div style={{ color: temp, fontWeight: 'bold', fontSize: "25px", lineHeight: "25px",
        width: '50%', maxWidth:'8ch', textAlign: 'center', margin: '0 auto', marginTop: "-5px"}} key={a.id}>
          <p>{a.name}</p>
        </div>
      );
    });
  };

  const renderGenres = () => {
    if (topGenres) {
      const styles = {
        container: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          margin: '0 auto',
          height: "110px", // adjust as necessary
          fontSize: "20px",
          fontWeight: 'bold',
          color: 'green'
        },
      };
      let currentMarginLeft = "center";
      return (
        <div>
          <div style={{ display: "flex", textAlign: "center" }}>
            <div
              key={topGenres[1]}
              style={{ ...styles.container, width: "30%", marginLeft: currentMarginLeft }}
            >
              <div style={{ transform: "rotate(55deg)" }}>
                <p>{topGenres[1]}</p>
              </div>
            </div>
            <div
              key={topGenres[2]}
              style={{ ...styles.container, width: "30%", marginLeft: "-40%" }}
            >
              <div style={{ transform: "rotate(-55deg)" }}>
                <p>{topGenres[2]}</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            <div
              key={topGenres[0]}
              style={{ ...styles.container, width: "30%", marginLeft: currentMarginLeft }}
            >
              <div style={{ transform: "rotate(5deg)" }}>
                <p>{topGenres[0]}</p>
              </div>
            </div>
            <div
              key={topGenres[3]}
              style={{ ...styles.container, width: "30%", marginLeft: "-25%" }}
            >
              <div style={{ transform: "rotate(-5deg)" }}>
                <p>{topGenres[3]}</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  const renderSongs1 = () => {
    let marginTop = 0;
    return (topSongsGenre1 || []).map((s, i) => {
      let curAlbum = s.album;
      let img = curAlbum.images[2];
      let curURL = img.url;
      marginTop += 80; // increase marginTop for each top song
      return (
        <div key={i} className='top-songs1' style={{ marginTop: marginTop + 'px'}}>
          
          <div style={{ display: 'flex'}}>
            <img src={curURL} alt={curAlbum.name} />
          </div>
          <div style={{ display: 'flex',  textAlign: 'left' }}>
            <p style={{ fontSize: '7px', color: 'green', marginTop: '-2px', fontWeight: 'bold' }}>{s.name}</p>
          </div>

        </div>
      );
    });
  };

  const renderSongs2 = () => {
    let marginLeft = 64;
    let marginTop = 0;
    return (topSongsGenre2 || []).map((s, i) => {
      let curAlbum = s.album;
      let img = curAlbum.images[2];
      let curURL = img.url;
      marginLeft -= 72;
      marginTop += 24;
      return (
        <div key={i} className='top-songs2' style={{ marginLeft: marginLeft + 'px', marginTop: marginTop + 'px'}}>
          <div style={{ display: 'flex'}}>
            <img src={curURL} alt={curAlbum.name} />
          </div>
          <div style={{ display: 'flex',  textAlign: 'left' }}>
            <p style={{ fontSize: '7px', color: 'green', marginTop: '-2px', fontWeight: 'bold' }}>{s.name}</p>
          </div>
        </div>
      );
    });
  };

  const renderSongs3 = () => {
    let marginLeft = 64;
    let marginTop = 0;
    return (topSongsGenre3 || []).map((s, i) => {
      let curAlbum = s.album;
      let img = curAlbum.images[2];
      let curURL = img.url;
      marginLeft += 72;
      marginTop += 24;
      return (
        <div key={i} className='top-songs3' style={{ marginLeft: marginLeft + 'px', marginTop: marginTop + 'px'}}>
          <div style={{ display: 'flex'}}>
            <img src={curURL} alt={curAlbum.name} />
          </div>
          <div style={{ display: 'flex',  textAlign: 'left' }}>
            <p style={{ fontSize: '7px', color: 'green', marginTop: '-2px', fontWeight: 'bold' }}>{s.name}</p>
          </div>
  
        </div>
      );
    });
  };

  const renderSongs4 = () => {
    let marginTop = 0;
    return (topSongsGenre4 || []).map((s, i) => {
      let curAlbum = s.album;
      let img = curAlbum.images[2];
      let curURL = img.url;
      marginTop += 80; // increase marginTop for each top song
      return (
        <div key={i} className='top-songs4' style={{ marginTop: marginTop + 'px'}}>
          <div style={{ display: 'flex'}}>
            <img src={curURL} alt={curAlbum.name} />
          </div>
          <div style={{ display: 'flex',  textAlign: 'left'}}>
            <p style={{ fontSize: '7px', color: 'green', marginTop: '-2px', fontWeight: 'bold' }}>{s.name}</p>
          </div>

        </div>
      );
    });
  };

  //*******WEBSITE*******


  const logout = () => {
    setToken("")
    window.localStorage.removeItem("token")
    setLoggedIn(false);
  }

  return (
    <div className = "App">
      <header className="App-header">
      </header>
      {!loggedIn ?
        <><h1 style={{fontSize:100, fontWeight:'bold', color: 'green'}}> Treeify </h1>
        <p style={{fontSize:15, color: 'black'}}>
          Made by <a href = {'https://www.instagram.com/ethan_kemper/'} style={{fontSize:15, color: ' black'}}>ethan kemper</a>
        </p>
        <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URL}&scope=${SCOPE}&response_type=${RESPONSE_TYPE}`}><Button> Login to Spotify </Button></a>
        </>
        : 
        <>
        <div style={{marginTop: "130px"}}>
            {renderSongs1()}
            {renderSongs2()}
            {renderSongs3()}
            {renderSongs4()}
            {renderGenres()}
            {renderArtists()}
        </div>
        <Button onClick={logout} style={{marginTop: '5%'}}> Logout of Spotify </Button></>
      }
    </div>
  );
}

export default App;
