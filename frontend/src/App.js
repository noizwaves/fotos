import React from 'react';
import axios from 'axios'
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
  state = {
    photosBy: [],
    columns: 6,
    selected: null,
  }

  componentDidMount() {
    axios.get('http://localhost:3001/api/photos')
      .then(response => {
        const photosBy = groupBy(p => `${p.date.year}-${p.date.month}-${p.date.day}`, response.data)
        this.setState({photos: response.data, photosBy: photosBy})
      })
  }

  renderPhotosBy = () => {
    return this.state.photosBy.map(({key, items}, i) => {
      const photos = items.map((photo, k) => {
        return (
            <div key={`${i}-${k}`} className="photo">
              <img src={photo.thumbnailUrl} alt={photo.filename} onClick={this.selectPhoto(photo)} />
            </div>
        )
      })

      return (
          <>
            <h2>{key}</h2>
            <div key={i} className={`gallery gallery-${this.state.columns}`}>
              {photos}
            </div>
          </>
      )
    });
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
        {this.renderShowcase()}
        {this.renderPhotosBy()}
      </>
    );
  }
}

export default App;
