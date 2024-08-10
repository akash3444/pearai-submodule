import {
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { IndexingProgressUpdate } from 'core';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  CustomScrollbarDiv,
  defaultBorderRadius,
  vscForeground,
  vscInputBackground,
  vscBackground,
} from '.';
import { useWebviewListener } from '../hooks/useWebviewListener';
import { defaultModelSelector } from '../redux/selectors/modelSelectors';
import {
  setBottomMessage,
  setBottomMessageCloseTimeout,
  setShowDialog,
} from '../redux/slices/uiStateSlice';
import { RootState } from '../redux/store';
import { getFontSize, isMetaEquivalentKeyPressed } from '../util';
import { isJetBrains, postToIde } from '../util/ide';
import { getLocalStorage } from '../util/localStorage';
import HeaderButtonWithText from './HeaderButtonWithText';
import TextDialog from './dialogs';
import { ftl } from './dialogs/FTCDialog';
import IndexingProgressBar from './loaders/IndexingProgressBar';
import ProgressBar from './loaders/ProgressBar';
import ModelSelect from './modelSelection/ModelSelect';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

// check mac or window
const platform = navigator.userAgent.toLowerCase();
const isMac = platform.includes('mac');
const isWindows = platform.includes('win');

// #region Styled Components
const HEADER_HEIGHT = '1.55rem';
const FOOTER_HEIGHT = '1.8em';

const LayoutTopDiv = styled(CustomScrollbarDiv)`
  min-height: 100%;
  border-radius: ${defaultBorderRadius};
`;

const BottomMessageDiv = styled.div<{ displayOnBottom: boolean }>`
  position: fixed;
  bottom: ${(props) => (props.displayOnBottom ? '50px' : undefined)};
  top: ${(props) => (props.displayOnBottom ? undefined : '50px')};
  left: 0;
  right: 0;
  margin: 8px;
  margin-top: 0;
  background-color: ${vscInputBackground};
  color: ${vscForeground};
  border-radius: ${defaultBorderRadius};
  padding: 12px;
  z-index: 100;
  box-shadow: 0px 0px 2px 0px ${vscForeground};
  max-height: 35vh;
`;

const Footer = styled.footer`
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: right;
  padding: 8px;
  align-items: center;
  width: calc(100% - 16px);
  height: ${FOOTER_HEIGHT};
  background-color: transparent;
  backdrop-filter: blur(12px);

  overflow: hidden;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 500;
  background-color: ${vscBackground};
  display: flex;
  justify-content: right;
  padding: 1px;
  width: calc(100% - 8px);
  height: ${HEADER_HEIGHT};
  overflow: hidden;
`;

const GridDiv = styled.div<{ showHeader: boolean }>`
  display: grid;
  grid-template-rows: ${(props) =>
    props.showHeader ? 'auto 1fr auto' : '1fr auto'};
  min-height: 100vh;
  overflow-x: visible;
`;

const DropdownPortalDiv = styled.div`
  background-color: ${vscInputBackground};
  position: relative;
  margin-left: 8px;
  z-index: 200;
  font-size: ${getFontSize()};
`;

// #endregion

const HIDE_FOOTER_ON_PAGES = [
  '/onboarding',
  '/existingUserOnboarding',
  '/localOnboarding',
];

const SHOW_SHORTCUTS_ON_PAGES = ['/'];

type ShortcutProps = {
  modifiers: string[];
  keyCode: string;
  description: string;
  onClick?: () => void;
};

const Shortcut = ({
  modifiers,
  keyCode,
  description,
  onClick,
}: ShortcutProps) => {
  const modifierString = modifiers.join(' + ');

  return (
    <div
      className='flex gap-1 items-center text-sm text-slate-400 rounded-lg px-1 cursor-pointer select-none m-0 mx-[2px] border-solid shortcut-border border-[1px]'
      onClick={onClick}
    >
      <span className='text-[12px]'>{description}</span>
      <div
        className='monaco-keybinding'
        aria-label={`${modifierString}+${keyCode}`}
      >
        {modifiers.map((mod, index) => (
          <span className='monaco-keybinding-key' key={index}>
            {mod}
          </span>
        ))}
        <span className='monaco-keybinding-key'>{keyCode}</span>
      </div>
    </div>
  );
};

const ShortcutContainer = () => {
  const shortcutContainerRef = useRef<HTMLDivElement>(null);
  const [modifier] = useState(isMac ? 'Cmd' : 'Ctrl');
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const scrollShortcut = (direction: 'left' | 'right') => {
    const SCROLL_OFFSET = 50;
    const clientWidth = shortcutContainerRef.current.clientWidth;
    const left =
      direction === 'left'
        ? -(clientWidth + SCROLL_OFFSET)
        : clientWidth - SCROLL_OFFSET;
    console.log('left :', left);
    shortcutContainerRef.current.scrollBy({ left, behavior: 'smooth' });
  };

  useEffect(() => {
    const shortcutContainer = shortcutContainerRef.current;
    if (shortcutContainer) {
      const handleWheel = (event: WheelEvent) => {
        if (event.deltaY !== 0) {
          event.preventDefault();
          shortcutContainer.scrollLeft += event.deltaY;
        }
      };

      shortcutContainer.addEventListener('wheel', handleWheel);
      return () => {
        shortcutContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  useEffect(() => {
    const shortcutContainer = shortcutContainerRef.current;

    const updateArrows = () => {
      setShowLeftArrow(shortcutContainer.scrollLeft > 0);

      setShowRightArrow(
        shortcutContainer.scrollLeft <
          shortcutContainer.scrollWidth - shortcutContainer.clientWidth,
      );
    };

    // Update arrows on scroll
    shortcutContainer.addEventListener('scroll', updateArrows);
  }, []);

  const shortcuts = [
    {
      modifiers: [modifier],
      keyCode: '[',
      description: 'Big',
      onClick: () => postToIde('bigChat', undefined),
    },
    {
      modifiers: [modifier],
      keyCode: '0',
      description: 'Prev',
      onClick: () => postToIde('lastChat', undefined),
    },
    { modifiers: [modifier], keyCode: 'O', description: 'History' },
    {
      modifiers: [modifier],
      keyCode: ';',
      description: 'Close',
      onClick: () => postToIde('closeChat', undefined),
    },
    {
      modifiers: [modifier, 'Shift'],
      keyCode: 'L',
      description: 'Add Selected',
    },
  ];

  return (
    <div className='w-full relative'>
      {showLeftArrow && (
        <button
          className='border-none absolute inset-y-0 flex items-center h-[1.55rem] bg-[#1f2428] cursor-pointer text-[#fff]'
          onClick={() => {
            scrollShortcut('left');
          }}
        >
          <ChevronLeftIcon className='h-4 w-4' />
        </button>
      )}
      <div
        ref={shortcutContainerRef}
        className='flex overflow-x-auto whitespace-nowrap no-scrollbar h-[1.55rem] ml-2'
      >
        {shortcuts.map((shortcut, index) => (
          <Shortcut
            modifiers={shortcut.modifiers}
            keyCode={shortcut.keyCode}
            description={shortcut.description}
          />
        ))}
      </div>
      {showRightArrow && (
        <button
          className='border-none absolute -right-1 inset-y-0 flex items-center h-[1.55rem] bg-[#1f2428] text-[#fff] cursor-pointer'
          onClick={() => {
            scrollShortcut('right');
          }}
        >
          <ChevronRightIcon className='h-4 w-4' />
        </button>
      )}
    </div>
  );
};

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const dialogMessage = useSelector(
    (state: RootState) => state.uiState.dialogMessage,
  );
  const showDialog = useSelector(
    (state: RootState) => state.uiState.showDialog,
  );

  const defaultModel = useSelector(defaultModelSelector);
  // #region Selectors

  const bottomMessage = useSelector(
    (state: RootState) => state.uiState.bottomMessage,
  );
  const displayBottomMessageOnBottom = useSelector(
    (state: RootState) => state.uiState.displayBottomMessageOnBottom,
  );

  const timeline = useSelector((state: RootState) => state.state.history);

  // #endregion

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (isMetaEquivalentKeyPressed(event) && event.code === 'KeyC') {
        const selection = window.getSelection()?.toString();
        if (selection) {
          // Copy to clipboard
          setTimeout(() => {
            navigator.clipboard.writeText(selection);
          }, 100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [timeline]);

  useWebviewListener(
    'addModel',
    async () => {
      navigate('/models');
    },
    [navigate],
  );

  useWebviewListener('openSettings', async () => {
    postToIde('openConfigJson', undefined);
  });

  useWebviewListener(
    'viewHistory',
    async () => {
      // Toggle the history page / main page
      if (location.pathname === '/history') {
        navigate('/');
      } else {
        navigate('/history');
      }
    },
    [location, navigate],
  );

  useWebviewListener('indexProgress', async (data) => {
    setIndexingState(data);
  });

  useWebviewListener(
    'addApiKey',
    async () => {
      navigate('/modelconfig/openai');
    },
    [navigate],
  );

  useWebviewListener(
    'setupLocalModel',
    async () => {
      postToIde('completeOnboarding', {
        mode: 'localAfterFreeTrial',
      });
      navigate('/localOnboarding');
    },
    [navigate],
  );

  useEffect(() => {
    if (isJetBrains()) {
      return;
    }
    const onboardingComplete = getLocalStorage('onboardingComplete');
    if (
      !onboardingComplete &&
      !location.pathname.startsWith('/onboarding') &&
      !location.pathname.startsWith('/existingUserOnboarding')
    ) {
      if (getLocalStorage('mainTextEntryCounter')) {
        navigate('/existingUserOnboarding');
      } else {
        navigate('/onboarding');
      }
    }
  }, [location]);

  const [indexingState, setIndexingState] = useState<IndexingProgressUpdate>({
    desc: 'Indexing disabled',
    progress: 0.0,
    status: 'disabled',
  });

  return (
    <LayoutTopDiv>
      <div
        style={{
          scrollbarGutter: 'stable both-edges',
          minHeight: '100%',
          display: 'grid',
          gridTemplateRows: '1fr auto',
        }}
      >
        <TextDialog
          showDialog={showDialog}
          onEnter={() => {
            dispatch(setShowDialog(false));
          }}
          onClose={() => {
            dispatch(setShowDialog(false));
          }}
          message={dialogMessage}
        />

        <GridDiv
          showHeader={SHOW_SHORTCUTS_ON_PAGES.includes(location.pathname)}
        >
          {SHOW_SHORTCUTS_ON_PAGES.includes(location.pathname) && (
            <Header>
              <ShortcutContainer />
            </Header>
          )}
          <Outlet />
          <DropdownPortalDiv id='model-select-top-div'></DropdownPortalDiv>
          {HIDE_FOOTER_ON_PAGES.includes(location.pathname) || (
            <Footer>
              <div className='mr-auto flex gap-2 items-center'>
                {/* {localStorage.getItem("ide") === "jetbrains" ||
                localStorage.getItem("hideFeature") === "true" || (
                  <SparklesIcon
                    className="cursor-pointer"
                    onClick={() => {
                      localStorage.setItem("hideFeature", "true");
                    }}
                    onMouseEnter={() => {
                      dispatch(
                        setBottomMessage(
                          `🎁 New Feature: Use ${getMetaKeyLabel()}⇧R automatically debug errors in the terminal (you can click the sparkle icon to make it go away)`
                        )
                      );
                    }}
                    onMouseLeave={() => {
                      dispatch(
                        setBottomMessageCloseTimeout(
                          setTimeout(() => {
                            dispatch(setBottomMessage(undefined));
                          }, 2000)
                        )
                      );
                    }}
                    width="1.3em"
                    height="1.3em"
                    color="yellow"
                  />
                )} */}
                <ModelSelect />
                {indexingState.status !== 'indexing' && // Would take up too much space together with indexing progress
                  defaultModel?.provider === 'free-trial' && (
                    <ProgressBar
                      completed={parseInt(localStorage.getItem('ftc') || '0')}
                      total={ftl()}
                    />
                  )}

                {isJetBrains() || (
                  <IndexingProgressBar indexingState={indexingState} />
                )}
              </div>
              <HeaderButtonWithText
                text='Help'
                onClick={() => {
                  if (location.pathname === '/help') {
                    navigate('/');
                  } else {
                    navigate('/help');
                  }
                }}
              >
                <QuestionMarkCircleIcon width='1.4em' height='1.4em' />
              </HeaderButtonWithText>
              <HeaderButtonWithText
                onClick={() => {
                  // navigate("/settings");
                  postToIde('openConfigJson', undefined);
                }}
                text='Configure PearAI'
              >
                <Cog6ToothIcon width='1.4em' height='1.4em' />
              </HeaderButtonWithText>
            </Footer>
          )}
        </GridDiv>

        <BottomMessageDiv
          displayOnBottom={displayBottomMessageOnBottom}
          onMouseEnter={() => {
            dispatch(setBottomMessageCloseTimeout(undefined));
          }}
          onMouseLeave={(e) => {
            if (!e.buttons) {
              dispatch(setBottomMessage(undefined));
            }
          }}
          hidden={!bottomMessage}
        >
          {bottomMessage}
        </BottomMessageDiv>
      </div>
      <div
        style={{ fontSize: `${getFontSize() - 4}px` }}
        id='tooltip-portal-div'
      />
    </LayoutTopDiv>
  );
};

export default Layout;
