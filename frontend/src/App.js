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
  faAngleDoubleLeft
} from '@fortawesome/free-solid-svg-icons'

import './reset.css'
import './App.css'

const groupBy = (keyFunc, items) => {
  const hash = items.reduce((arr, item) => {
    const key = keyFunc(item)
    return (arr[key] ? arr[key].push(item) : arr[key] = [item], arr)
  }, {})

  return Object.keys(hash).map(key => ({key: key, items: hash[key]}));
}

const Toolbar = ({inputRef, onGoToDate, onInputBlur, onInputFocus, onMinus, onPlus, onAlbums, showAlbumBrowser}) => {
  const [value, setValue] = React.useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    onGoToDate(value)
    setValue('')
  }
  const handleChange = (event) => {
    setValue(event.target.value)
  }

  const albumButtonClasses = showAlbumBrowser ? 'button selected' : 'button'

  return (
    <div className="toolbar">
      <button className="button" onClick={onPlus}>
        <FontAwesomeIcon icon={faPlus} />
      </button>
      <button className="button" onClick={onMinus}>
        <FontAwesomeIcon icon={faMinus} />
      </button>
      <button className={albumButtonClasses} onClick={onAlbums}>
        <FontAwesomeIcon icon={faFolder} />
      </button>
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

const AlbumBrowser = ({rootFolder, expandedFolderIds, toggleFolder, selectAlbum}) => {
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
          <span className="name" onClick={() => selectAlbum(item)}>{item.name}</span>
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
  const cache = React.useRef(new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 300,
  }))
  const displayed = React.useRef(new CellDisplayedCache())
  const scrollingRef = React.useRef({timeout: null})
  const list = React.useRef(null)
  const inputRef = React.useRef(null)
  const galleryRef = React.useRef(null)

  const resetCache = () => cache.current.clearAll()

  const [photosBy, setPhotosBy] = React.useState([])
  const [photos, setPhotos] = React.useState([])
  const [columns, setColumns] = React.useState(6)
  const [selected, setSelected] = React.useState(null)
  const [scrolling, setScrolling] = React.useState(false)
  const [inputting, setInputting] = React.useState(false)

  const [showAlbumBrowser, setShowAlbumBrowser] = React.useState(false)
  const [selectedAlbum, setSelectedAlbum] = React.useState(null)

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
  }, [columns, inputting, selected])

  const handleKeydown = (event) => {
    if (!inputting && !selected) {
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

  const renderPhotosBy = () => {
    if (selectedAlbum || showAlbumBrowser) {
      return null
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
            <img src={photosSrc} alt={photo.name} onClick={selectPhoto(photo)}/>
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
      </div>
    )
  }

  const renderAlbum = () => {
    if (!selectedAlbum) {
      return null
    }

    const renderPhotos = (album) => {
      const photos = album.photos.map((photo, k) => {
        const photosSrc = `${THUMBNAILS_ROOT}/${photo.path}`
        return (
          <div key={k} className="photo">
            <img src={photosSrc} alt={photo.name} onClick={selectPhoto(photo)} />
          </div>
        )
      })

      return (
        <div className="day-gallery">
          <h2>
            <FontAwesomeIcon className="back" icon={faAngleDoubleLeft} onClick={() => setSelectedAlbum(null)}/>
            <span> {album.name}</span>
          </h2>
          <div className={`gallery gallery-${columns}`}>
            {photos}
          </div>
        </div>
      )
    }

    return (
      <div
        tabIndex={4}
        style={{width: "100%", height: "calc(100vh - 3rem - 1px)"}}
      >
        {renderPhotos(selectedAlbum)}
      </div>
    )
  }

  const renderAlbumBrowser = () => {
    if (!showAlbumBrowser || selectedAlbum) {
      return null
    }

    return (
      <AlbumBrowser
        rootFolder={rootFolder}
        expandedFolderIds={expandedFolderIds}
        toggleFolder={handleToggleFolder}
        selectAlbum={handleSelectAlbum}
      />
    )
  }

  const selectPhoto = (photo) => {
    return () => {
      setSelected(photo)
    }
  }

  const unselectPhoto = () => {
    setSelected(null)
  }

  const handleNext = () => {
    const possiblePhotos = selectedAlbum ? selectedAlbum.photos : photos;

    const current = possiblePhotos.indexOf(selected)

    if (current + 1 < possiblePhotos.length) {
      setSelected(possiblePhotos[current + 1])
    }
  }

  const handlePrevious = () => {
    const possiblePhotos = selectedAlbum ? selectedAlbum.photos : photos;

    const current = possiblePhotos.indexOf(selected)

    if (current > 0) {
      setSelected(possiblePhotos[current - 1])
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

  const handleInputBlur = () => {
    setInputting(false)
  }

  const handleInputFocus = () => {
    setSelectedAlbum(null)
    setShowAlbumBrowser(false)
    setInputting(true)
  }

  const handleSelectAlbum = (album) => {
    setSelectedAlbum(album)
  }

  const handleToggleFolder = (id) => {
    if (expandedFolderIds.indexOf(id) >= 0) {
      setExpandedFolderIds(expandedFolderIds.filter(eid => eid !== id))
    } else {
      setExpandedFolderIds(expandedFolderIds.concat([id]))
    }
  }

  const handleAlbumBrowserToggle = () => {
    setShowAlbumBrowser(!showAlbumBrowser)
    setSelectedAlbum(null)
  }

  return (
    <>
      <Toolbar
        inputRef={inputRef}
        onAlbums={handleAlbumBrowserToggle}
        showAlbumBrowser={showAlbumBrowser}
        onPlus={handlePlus}
        onMinus={handleMinus}
        onGoToDate={handleGoToDate}
        onInputBlur={handleInputBlur}
        onInputFocus={handleInputFocus}
      />
      {renderPhotosBy()}
      {renderAlbumBrowser()}
      {renderAlbum()}
      <Showcase
        selected={selected}
        onUnselect={unselectPhoto}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </>
  );
}

export default App;
