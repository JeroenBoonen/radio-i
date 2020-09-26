import React, {
  Fragment,
  useCallback,
  useMemo,
  useState,
  useEffect
} from 'react';
import { useHistory } from 'react-router-dom';

import radioiApi from '../../apis/radioi-api';
import Spinner from '../../common-components/spinner';
import CustomCheckbox from '../../common-components/custom-checkbox';
import SpotifyButton from '../../common-components/spotify-button';
import InverseSpotifyButton from '../../common-components/inverse-spotify-button';

import { useAuthentication } from '../authentication';

import './styles.css';
import Tooltip from '../../common-components/tooltip';

const publicRadioTooltip = 'Will be published in the home page';
const collaborativeRadioTooltip =
  'Anyone will be able to add new songs to the radio';
const anonymousRadioTooltip = 'Your username will not be shown in the radio';

const StartRadio = ({ id }) => {
  const history = useHistory();
  const { user } = useAuthentication();

  const [radioname, setRadioname] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const onInputChange = useCallback(e => setRadioname(e.target.value), []);
  const onPublicChange = useCallback(e => setIsPublic(e.target.checked), []);
  const onCollaborativeChange = useCallback(
    e => setIsCollaborative(e.target.checked),
    []
  );
  const onAnonymousChange = useCallback(
    e => setIsAnonymous(e.target.checked),
    []
  );
  const startRadio = useCallback(
    async e => {
      e.preventDefault();
      try {
        const radioName = radioname !== '' ? radioname : 'Radio';
        const radioBy = isAnonymous ? '' : `by ${user.display_name}`;
        await radioiApi.startRadio(
          id,
          `${radioName} ${radioBy}`,
          isPublic,
          isCollaborative,
          isAnonymous
        );
        history.push(`/radio?id=${id}`);
      } catch (e) {
        console.log('Could not create radio');
      }
    },
    [id, user, radioname, isPublic, isCollaborative, isAnonymous]
  );

  return (
    <Fragment>
      <h2>Give your radio a name</h2>
      <h2>& start playing some music</h2>
      <form autoComplete="off">
        <input
          type="text"
          name="radio-name"
          id="radio-name"
          spellCheck="false"
          maxLength="35"
          onChange={onInputChange}
        />
        <div className="row">
          <div className="col span-1-of-2">
            <SpotifyButton onClick={startRadio}>Start your radio</SpotifyButton>
          </div>
          <div className="col span-1-of-2">
            <div>
              <CustomCheckbox
                id="is-public"
                onChange={onPublicChange}
                className="radio-option-checkbox"
              />
              <Tooltip text={publicRadioTooltip}>
                <h3>Public Radio</h3>
              </Tooltip>
            </div>
            <div>
              <CustomCheckbox
                id="is-collaborative"
                onChange={onCollaborativeChange}
                className="radio-option-checkbox"
              />
              <Tooltip text={collaborativeRadioTooltip}>
                <h3>Collaborative Radio</h3>
              </Tooltip>
            </div>
            <div>
              <CustomCheckbox
                id="is-anonymous"
                onChange={onAnonymousChange}
                className="radio-option-checkbox"
              />
              <Tooltip text={anonymousRadioTooltip}>
                <h3>Anonymous Radio</h3>
              </Tooltip>
            </div>
          </div>
        </div>
      </form>
    </Fragment>
  );
};

const RadioStarted = ({ id, setRadioExists }) => {
  const history = useHistory();
  const goToRadio = useCallback(() => {
    history.push(`/radio?id=${id}`);
  }, [id]);
  const stopRadio = useCallback(async () => {
    await radioiApi.stopRadio();
    setRadioExists(false);
  }, [id]);
  return (
    <Fragment>
      <h2>Your radio is broadcasting!</h2>
      <div className="row">
        <div className="col span-1-of-2">
          <SpotifyButton onClick={goToRadio}>Go to Radio</SpotifyButton>
        </div>
        <div className="col span-1-of-2">
          <InverseSpotifyButton onClick={stopRadio}>
            Stop Radio
          </InverseSpotifyButton>
        </div>
      </div>
    </Fragment>
  );
};

const RadioDisplayItem = ({ radioName, isCollaborative, onClick }) => (
  <li>
    <SpotifyButton onClick={onClick}>Go to Radio</SpotifyButton>
    <h3>{radioName}</h3>
    {isCollaborative ? (
      <span>
        <h5>Collaborative</h5>
        <i className="material-icons">check_circle</i>
      </span>
    ) : null}
  </li>
);

const RadiosDisplay = () => {
  const history = useHistory();
  const [latestRadios, setLatestRadios] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await radioiApi.getLatestRadio();
      setLatestRadios(data);
    })();
  }, []);

  const goToRadio = useCallback(id => {
    history.push(`/radio?id=${id}`);
  }, []);

  return (
    <section className="section-radios-display">
      <div className="row">
        <h2>...or start listening to some radios</h2>
        <ul className="radios-list">
          {latestRadios.length > 0 ? (
            latestRadios.map(({ hash, radioName, isCollaborative }) => (
              <RadioDisplayItem
                key={hash}
                radioName={radioName}
                isCollaborative={isCollaborative}
                onClick={() => goToRadio(hash)}
              />
            ))
          ) : (
            <h3>The are no active radios right now </h3>
          )}
        </ul>
      </div>
    </section>
  );
};

const Lobby = () => {
  const [loading, setLoading] = useState(true);
  const [radioExists, setRadioExists] = useState(false);
  const { user } = useAuthentication();
  const id = useMemo(() => user && user.hash, [user]);

  useEffect(() => {
    if (id) {
      (async () => {
        try {
          await radioiApi.getRadio(id);
          setRadioExists(true);
          setLoading(false);
        } catch (error) {
          if (error.response.status === 404) {
            setRadioExists(false);
            setLoading(false);
          } else {
            console.log(error);
          }
        }
      })();
    }
  }, [id]);

  return (
    <Fragment>
      <section className="section-lobby background-img">
        <div className="row">
          <div className="col span-1-of-2">
            <div className="lobby-left-box">
              {loading ? (
                <Spinner />
              ) : radioExists ? (
                <RadioStarted id={id} setRadioExists={setRadioExists} />
              ) : (
                <StartRadio id={id} />
              )}
            </div>
          </div>
          <div className="col span-1-of-2"></div>
        </div>
      </section>
      {!loading && !radioExists && <RadiosDisplay />}
    </Fragment>
  );
};

const Home = () => (
  <section className="section-home background-img">
    <div className="row">
      <div className="home-text-box">
        <h2>Create a radio.</h2>
        <h2>Share it with friends.</h2>
        <h2>Let everyone listen to what you play!</h2>
      </div>
    </div>
  </section>
);

const HomeRouter = () => {
  const { loading, authenticated } = useAuthentication();
  return loading ? <Spinner /> : authenticated ? <Lobby /> : <Home />;
};

export default HomeRouter;
