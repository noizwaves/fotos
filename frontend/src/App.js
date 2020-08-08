import React from 'react';
import axios from 'axios'
import {DateTime} from 'luxon';
import {
  List,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized'

import './reset.css'
import './App.css'

const groupBy = (keyFunc, items) => {
  const hash = items.reduce((arr, item) => {
    const key = keyFunc(item)
    return (arr[key] ? arr[key].push(item) : arr[key] = [item], arr)
  }, {})

  return Object.keys(hash).map(key => ({key: key, items: hash[key]}));
}

const Toolbar = (props) => {
  return (
    <div className="toolbar">
      <button onClick={props.onPlus}>+</button>
      <button onClick={props.onMinus}>-</button>
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

const MAX_COLUMNS = 12;
const MIN_COLUMNS = 2;
const PHOTOS_ROOT = '/photos'
const THUMBNAILS_ROOT = '/thumbnails'

const App = () => {
  const cache = React.useRef(new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 300,
  }))
  const scrollingRef = React.useRef({timeout: null})

  const resetCache = () => cache.current.clearAll()

  const [photosBy, setPhotosBy] = React.useState([])
  const [photos, setPhotos] = React.useState([])
  const [columns, setColumns] = React.useState(6)
  const [selected, setSelected] = React.useState(null)
  const [scrolling, setScrolling] = React.useState(false)

  React.useEffect(() => {
    axios.get('/api/photos')
      .then(response => {
        const paths = response.data

        const photos =
          paths
            .map(path => {
              return {
                path: path,
                name: path.split('/')[3],
                date: path.split('/').splice(0,3).join('-')
              }
            })
        setPhotos(photos)

        const photosBy = groupBy(p => p.date, photos)
        photosBy.forEach(({items}) => items.reverse())
        setPhotosBy(photosBy)
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
  }, [columns])

  const handleKeydown = (event) => {
    if (event.keyCode === 173) {
      handleMinus()
    } else if (event.keyCode === 61) {
      handlePlus()
    }
  }

  const renderPhotosBy = () => {
    const renderGallery = ({key, index, style, parent}) => {
      const items = photosBy[index].items
      const date = DateTime
        .fromFormat(photosBy[index].key, "yyyy-MM-dd")
        .toLocaleString({weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'})

      const photos = items.map((photo, k) => {
        return (
          <div key={`${index}-${k}`} className="photo">
            <img src={`${THUMBNAILS_ROOT}/${photo.path}`} alt={photo.name} onClick={selectPhoto(photo)}/>
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
          className={scrolling ? "galleries scrolling" : "galleries"}
          width={width}
          height={height}
          rowHeight={cache.current.rowHeight}
          deferredMeasurementCache={cache.current}
          rowCount={photosBy.length}
          rowRenderer={renderGallery}
          onScroll={recordScrolling}
        />
      )
    }

    return (
      <div style={{width: "100%", height: "calc(100vh - 2rem)"}}>
        <AutoSizer>
          {({width, height}) => {
            return renderGalleries(width, height)
          }}
        </AutoSizer>
      </div>
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

  return (
    <>
      <Toolbar onPlus={handlePlus} onMinus={handleMinus}/>
      {renderPhotosBy()}
      <Showcase selected={selected} onUnselect={unselectPhoto} onNext={handleNext} onPrevious={handlePrevious}/>
    </>
  );
}

export default App;
