import React from 'react';
import axios from 'axios'
import {DateTime} from 'luxon';
import {
  List,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faPlus,
  faMinus,
  faCaretRight,
  faCaretDown,
  faAngleDoubleLeft,
  faImages
} from '@fortawesome/free-solid-svg-icons'
import {
  Switch,
  Route,
  Link,
  NavLink,
  useParams,
  useHistory
} from 'react-router-dom';

import './reset.css'
import './App.css'

const groupBy = (keyFunc, items) => {
  const hash = items.reduce((arr, item) => {
    const key = keyFunc(item)
    return (arr[key] ? arr[key].push(item) : arr[key] = [item], arr)
  }, {})

  return Object.keys(hash).map(key => ({key: key, items: hash[key]}));
}

const Toolbar = ({inputRef, onGoToDate, onInputBlur, onInputFocus, onMinus, onPlus}) => {
  const [value, setValue] = React.useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onGoToDate(value)
    setValue('')
  }
  const handleChange = (event) => {
    setValue(event.target.value)
  }

  return (
    <div className="toolbar">
      <button className="button" onClick={onPlus}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <button className="button" onClick={onMinus}>
        <FontAwesomeIcon icon={faMinus} />
      </button>
      <NavLink to="/" className="button" activeClassName="selected" exact={true}>
        <FontAwesomeIcon icon={faImages} />
      </NavLink>
      <NavLink to="/albums" className="button" activeClassName="selected">
        <FontAwesomeIcon icon={faFolder} />
      </NavLink>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          value={value}
          placeholder="YYYY, YYYY-MM, or YYYY-MM-DD"
          onChange={handleChange}
        />
      </form>
    </div>
  )
}

const PhotosBy = ({cache, list, galleryRef, columns, photosBy, photos}) => {
  const [scrolling, setScrolling] = React.useState(false)
  const [selected, setSelected] = React.useState(null)

  // TODO: handle reset on plus/minus to clear cache
  // const cache = React.useRef(new CellMeasurerCache({
  //   fixedWidth: true,
  //   defaultHeight: 300,
  // }))
  // TODO: accept list so we can be scrolled to
  // const list = React.useRef(null)
  // TODO: accept galleryRef so we can be scrolled to
  // const galleryRef = React.useRef(null)

  const displayed = React.useRef(new CellDisplayedCache())
  const scrollingRef = React.useRef({timeout: null})


  const handleNext = () => {
    const current = photos.indexOf(selected)

    if (current + 1 < photos.length) {
      setSelected(photos[current + 1])
    }
  }

  const handlePrevious = () => {
    const current = photos.indexOf(selected)

    if (current > 0) {
      setSelected(photos[current - 1])
    }
  }

  const renderGallery = ({key, index, style, parent, isScrolling, isVisible}) => {
    const items = photosBy[index].items
    const date = DateTime
      .fromFormat(photosBy[index].key, "yyyy-MM-dd")
      .toLocaleString({weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})

    const renderPhoto = displayed.current.shouldDisplayCell(index, isVisible, isScrolling)
    const photos = items.map((photo, k) => {
      const photosSrc = renderPhoto ? `${THUMBNAILS_ROOT}/${photo.path}` : '/placeholder.png'
      return (
        <div key={`${index}-${k}`} className="photo">
          <img src={photosSrc} alt={photo.name} onClick={() => setSelected(photo)} />
        </div>
      )
    })

    return (
      <CellMeasurer key={key} cache={cache.current} parent={parent} columnIndex={0} rowIndex={index}>
        <div className="day-gallery" style={style}>
          <h2>{date}</h2>
          <div className={`gallery gallery-${columns}`}>
            {photos}
          </div>
        </div>
      </CellMeasurer>
    )
  }

  const recordScrolling = () => {
    // ensure state knows we are definitely scrolling
    setScrolling(true)

    // restart the timeout that signifies scrolling has stopped
    window.clearTimeout(scrollingRef.current.timeout)
    scrollingRef.current.timeout = setTimeout(() => {
      setScrolling(false)
    }, 2000)
  }

  const renderGalleries = (width, height) => {
    return (
      <List
        ref={list}
        className={scrolling ? "galleries scrolling" : "galleries"}
        width={width}
        height={height}
        rowHeight={cache.current.rowHeight}
        deferredMeasurementCache={cache.current}
        rowCount={photosBy.length}
        rowRenderer={renderGallery}
        onScroll={recordScrolling}
        scrollToAlignment="start"
      />
    )
  }

  return (
    <div
      ref={galleryRef}
      tabIndex={4}
      style={{width: "100%", height: "calc(100vh - 3rem - 1px)"}}
    >
      <AutoSizer>
        {({width, height}) => {
          return renderGalleries(width, height)
        }}
      </AutoSizer>
      <Showcase
        selected={selected}
        onUnselect={() => setSelected(null)}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  )
}

const AlbumBrowser = ({rootFolder, expandedFolderIds, toggleFolder}) => {
  const urlSafe = (id) => {
    return encodeURIComponent(id)
  }

  const albumOrFolder = (item) => {
    if (item.contents) {
      if (expandedFolderIds.indexOf(item.id) >= 0) {
        return (
          <div className="folder" key={item.id}>
            <span className="toggle">
              <FontAwesomeIcon icon={faCaretDown} onClick={() => toggleFolder(item.id)}/>
            </span>
            <span className="name" onClick={() => toggleFolder(item.id)}>{item.name}</span>
            <div className="contents">
              {item.contents.map(albumOrFolder, expandedFolderIds)}
            </div>
          </div>
        )
      } else {
        return (
          <div className="folder" key={item.id}>
            <span className="toggle">
              <FontAwesomeIcon icon={faCaretRight} onClick={() => toggleFolder(item.id)}/>
            </span>
            <span className="name" onClick={() => toggleFolder(item.id)}>{item.name}</span>
          </div>
        )
      }
    } else {
      return (
        <div className="album" key={item.id}>
          <Link to={'/albums/' + urlSafe(item.id)} className="name">{item.name}</Link>
        </div>
      )
    }
  }

  return (
    <div className="album-browser">
      {rootFolder !== null ? rootFolder.contents.map(albumOrFolder, expandedFolderIds) : null}
    </div>
  )
}

// Gallery Types

const SquareThumbnailContents = ({photos, columns, setSelected}) => {
  return (
    <div className={`gallery gallery-${columns}`}>
      {
        photos.map((photo, k) => {
          const photosSrc = `${THUMBNAILS_ROOT}/${photo.path}`
          return (
            <div key={k} className="photo">
              <img src={photosSrc} alt={photo.name} onClick={() => setSelected(photo)} />
            </div>
          )
        })
      }
    </div>
  )
}

const VerticalStripeContents = ({photos, setSelected}) => {
  const MAX_STRIPES = 12
  const MIN_STRIPES = 2
  const numStripes = Math.max(MIN_STRIPES, Math.min(photos.length, MAX_STRIPES))
  return (
    <div className={`vertical-strips vertical-strips-${numStripes}`}>
      {
        photos.map((photo, k) => {
          const photosSrc = `${PHOTOS_ROOT}/${photo.path}`
          const style = {
            backgroundImage: `url('${photosSrc}')`
          }
          return (
            <div key={k} className="photo" style={style} onClick={() => setSelected(photo)}>
            </div>
          )
        })
      }
    </div>
  )
}

const AlbumContents = ({albums, columns}) => {
  let { albumId } = useParams();

  const [selected, setSelected] = React.useState(null)

  const getContentsComponent = (album) => {
    const galleryType = album.galleryType || 'SquareThumbnails'

    switch (galleryType) {
      case 'VerticalStripes':
        return VerticalStripeContents
      case 'SquareThumbnails':
        return SquareThumbnailContents;
      default:
        throw Error(`Unknown gallery type "${galleryType}"`)
    }
  }

  const renderPhotos = (album) => {
    const Contents = getContentsComponent(album)
    return (
      <div className="day-gallery">
        <h2>
          <span> {album.name}</span>
        </h2>
        <Contents photos={album.photos} columns={columns} setSelected={setSelected} galleryOptions={album.galleryOptions}/>
      </div>
    )
  }

  const selectedAlbum = (albums || []).filter(a => a.id === decodeURIComponent(albumId))[0]

  const handleNext = () => {
    const current = selectedAlbum.photos.indexOf(selected)

    if (current + 1 < selectedAlbum.photos.length) {
      setSelected(selectedAlbum.photos[current + 1])
    }
  }

  const handlePrevious = () => {
    const current = selectedAlbum.photos.indexOf(selected)

    if (current > 0) {
      setSelected(selectedAlbum.photos[current - 1])
    }
  }

  if (selectedAlbum) {
    return (
      <div
        tabIndex={4}
        style={{width: "100%", height: "calc(100vh - 3rem - 1px)"}}
      >
        {renderPhotos(selectedAlbum)}
        <Showcase
          selected={selected}
          onUnselect={() => setSelected(null)}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    )
  } else {
    return (
      <></>
    )
  }
}

const Showcase = ({selected, onUnselect, onNext, onPrevious}) => {
  React.useEffect(() => {
    const handleKeydown = (event) => {
      if (event.keyCode === 37) {
        onPrevious()
      } else if (event.keyCode === 39) {
        onNext()
      } else if (event.keyCode === 27) {
        onUnselect()
      }
    }

    if (selected !== null) {
      window.addEventListener('keydown', handleKeydown)
      return () => {
        window.removeEventListener('keydown', handleKeydown)
      }
    }
  }, [selected])

  if (!selected) {
    return null
  }

  return (
    <div className="showcase" onClick={onUnselect}>
      <img src={`${PHOTOS_ROOT}/${selected.path}`} alt={selected.name}/>
    </div>
  )
}

class CellDisplayedCache {
  _state = {};

  shouldDisplayCell(index, isVisible, isScrolling) {
    this._state[index] = this._state[index] || (isVisible && !isScrolling)
    return this._state[index]
  }
}

const makePhoto = (path) => {
  return {
    path: path,
    name: path.split('/')[3],
    date: path.split('/').splice(0,3).join('-')
  }
}

const MAX_COLUMNS = 12;
const MIN_COLUMNS = 2;
const PHOTOS_ROOT = '/photos'
const THUMBNAILS_ROOT = '/thumbnails'

const App = () => {
  const history = useHistory()

  const cache = React.useRef(new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 300,
  }))
  const list = React.useRef(null)
  const inputRef = React.useRef(null)
  const galleryRef = React.useRef(null)

  const resetCache = () => cache.current.clearAll()

  const [photosBy, setPhotosBy] = React.useState([])
  const [photos, setPhotos] = React.useState([])
  const [columns, setColumns] = React.useState(6)
  const [inputting, setInputting] = React.useState(false)

  const [albums, setAlbums] = React.useState(null)
  const [rootFolder, setRootFolder] = React.useState(null)
  const [expandedFolderIds, setExpandedFolderIds] = React.useState([])

  React.useEffect(() => {
    axios.get('/api/photos')
      .then(response => {
        const paths = response.data
        const photos = paths.map(makePhoto)
        setPhotos(photos)

        const photosBy = groupBy(p => p.date, photos)
        photosBy.forEach(({items}) => items.reverse())
        setPhotosBy(photosBy)
      })
  }, [])

  React.useEffect(() => {
    axios.get('/api/albums')
      .then(response => {
        const albums = response.data.map((album) => {
          return {...album, photos: album.photos.map(makePhoto)}
        })

        const rootFolder = {name: 'Root Folder', id: '/', contents: []}

        albums.forEach(album => {
          // create folders for this album
          const folderNames = album.id.split('/')

          let current = rootFolder

          for (let i = 0; i < folderNames.length - 1; i++) {
            const folderName = folderNames[i]
            const existing = current.contents.find(item => item.contents && item.name === folderName)
            if (existing) {
              current = existing
            } else {
              const newFolder = {id: `${current.id}${folderName}/`, name: folderName, contents: []}
              current.contents.push(newFolder)
              current = newFolder
            }
          }

          // put album in folder
          current.contents.push(album)
        })

        setRootFolder(rootFolder)
        setAlbums(albums)
      })
  }, [])

  React.useEffect(() => {
    window.addEventListener('resize', resetCache)

    return () => {
      window.removeEventListener('resize', resetCache)
    }
  }, [])

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [columns, inputting])

  const handleKeydown = (event) => {
    // TODO: don't trigger when showcase is displayed...
    if (!inputting) {
      if (event.keyCode === 173) {
        handleMinus()
      } else if (event.keyCode === 61) {
        handlePlus()
      } else if (event.keyCode === 71) {
        inputRef.current.focus()
        event.preventDefault()
      }
    }
  }

  const handleMinus = () => {
    // Already at minimum number of columns
    if (columns >= MAX_COLUMNS) {
      return
    }

    // Clear the cache, so the next re-render generates new values
    resetCache()
    setColumns(columns + 1)
  }

  const handlePlus = () => {
    // Already at minimum number of columns
    if (columns <= MIN_COLUMNS) {
      return
    }

    // Clear the cache, so the next re-render generates new values
    resetCache()
    setColumns(columns - 1)
  }

  const handleGoToDate = (value) => {
    const keys = photosBy
      .map(({key}) => key)

    const focusOnList = () => galleryRef.current.children[0].children[0].focus()

    if (value.length === 10) {
      // try an exact date match
      const row = keys.indexOf(value)

      if (row >= 0) {
        list.current.scrollToRow(row)
        focusOnList()
      } else {
        console.log(`date ${value} not found`)
      }
    } else if (value.length === 7) {
      // find the month
      const monthKeys = keys
        .filter((k) => k.startsWith(value))
      const monthKey = monthKeys[monthKeys.length - 1]

      if (monthKey && keys.indexOf(monthKey)) {
        list.current.scrollToRow(keys.indexOf(monthKey))
        focusOnList()
      } else {
        console.log(`month ${value} not found`)
      }
    } else if (value.length === 4) {
      // find the year
      const yearKeys = keys
        .filter((k) => k.startsWith(value))
      const yearKey = yearKeys[yearKeys.length - 1]

      if (yearKey && keys.indexOf(yearKey)) {
        list.current.scrollToRow(keys.indexOf(yearKey))
        focusOnList()
      } else {
        console.log(`year ${value} not found`)
      }
    }
  }

  const handleInputFocus = () => {
    setInputting(true)
    history.push('/')
  }

  const handleInputBlur = () => {
    setInputting(false)
  }

  const handleToggleFolder = (id) => {
    if (expandedFolderIds.indexOf(id) >= 0) {
      setExpandedFolderIds(expandedFolderIds.filter(eid => eid !== id))
    } else {
      setExpandedFolderIds(expandedFolderIds.concat([id]))
    }
  }

  return (
    <>
      <Toolbar
        inputRef={inputRef}
        list={list}
        onPlus={handlePlus}
        onMinus={handleMinus}
        onGoToDate={handleGoToDate}
        onInputBlur={handleInputBlur}
        onInputFocus={handleInputFocus}
      />
      <Switch>
        <Route path="/albums/:albumId">
          <AlbumContents
            columns={columns}
            albums={albums}
          />
        </Route>
        <Route path="/albums">
          <AlbumBrowser
            rootFolder={rootFolder}
            expandedFolderIds={expandedFolderIds}
            toggleFolder={handleToggleFolder}
          />
        </Route>
        <Route path="/">
          <PhotosBy
            cache={cache}
            list={list}
            galleryRef={galleryRef}
            photosBy={photosBy}
            photos={photos}
            columns={columns}
          />
        </Route>
      </Switch>
    </>
  );
}

export default App;
