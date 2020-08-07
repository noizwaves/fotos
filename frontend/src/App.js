import React from 'react';
import axios from 'axios'
import { DateTime } from 'luxon';
import {
  List,
  AutoSizer,
  CellMeasurer,
  CellMeasurerCache,
} from 'react-virtualized'

import './reset.css'
import './App.css'

function groupBy(keyFunc, items) {
  const hash = items.reduce((arr, item) => {
    const key = keyFunc(item)
    return (arr[key] ? arr[key].push(item) : arr[key] = [item], arr)
  }, {})

  return Object.keys(hash).map(key => ({key: key, items: hash[key]}));
}

class App extends React.Component {
  cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 300,
  })

  state = {
    photosBy: [],
    columns: 6,
    selected: null,
  }

  componentDidMount() {
    const pad2 = (n) => n < 10 ? `0${n}` : `${n}`

    axios.get('/api/photos')
      .then(response => {
        const photosBy = groupBy(p => `${p.date.year}-${pad2(p.date.month)}-${pad2(p.date.day)}`, response.data)
        this.setState({photos: response.data, photosBy: photosBy})
      })

    window.addEventListener('resize', this.resetCache.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resetCache.bind(this))
  }

  resetCache() {
    this.cache.clearAll()
  }

  renderPhotosBy = () => {
    const renderGallery = ({ key, index, style, parent }) => {
      const items = this.state.photosBy[index].items
      const date = DateTime
          .fromFormat(this.state.photosBy[index].key, "yyyy-MM-dd")
          .toLocaleString({ weekday: 'long', month: 'long', day: '2-digit', year: 'numeric'})

      const photos = items.map((photo, k) => {
        return (
            <div key={`${index}-${k}`} className="photo">
              <img src={photo.thumbnailUrl} alt={photo.filename} onClick={this.selectPhoto(photo)} />
            </div>
        )
      })

      return (
          <CellMeasurer key={key} cache={this.cache} parent={parent} columnIndex={0} rowIndex={index}>
            <div style={style}>
              <h2>{date}</h2>
              <div key={index} className={`gallery gallery-${this.state.columns}`}>
                {photos}
              </div>
            </div>
          </CellMeasurer>
      )
    }

    const renderGalleries = (width, height) => {
      return (
          <List
              width={width}
              height={height}
              rowHeight={this.cache.rowHeight}
              deferredMeasurementCache={this.cache}
              rowCount={this.state.photosBy.length}
              rowRenderer={renderGallery}
          >
          </List>
      )
    }

    return (
        <div style={{ width: "100%", height: "100vh" }}>
          <AutoSizer>
            {({ width, height}) => {
              return renderGalleries(width, height)
            }}
          </AutoSizer>
        </div>
    )
  }

  selectPhoto = (photo) => {
    return () => {
      this.setState({ selected: photo })
    }
  }

  unselectPhoto = () => {
    this.setState({ selected: null })
  }

  renderShowcase = () => {
    if (!this.state.selected) {
      return null
    }

    const photo = this.state.selected
    return (
        <div className="showcase" onClick={this.unselectPhoto}>
          <img src={photo.rawUrl} alt={photo.filename} />
        </div>
    )
  }

  render() {
    return (
      <>
        {this.renderPhotosBy()}
        {this.renderShowcase()}
      </>
    );
  }
}

export default App;
