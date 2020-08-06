import React from 'react';
import axios from 'axios'
import './reset.css'
import './App.css'

class App extends React.Component {
  state = {
    photos: [],
    columns: 6,
    selected: null,
  }

  componentDidMount() {
    axios.get('http://localhost:3001/api/photos')
      .then(response => {
        console.log(response)
        this.setState({photos: response.data})
      })
  }

  renderPhotos = () => {
    return this.state.photos.map((photo, i) => {
      return (
        <div key={i} className="photo">
          <img src={photo.thumbnailUrl} alt={photo.filename} onClick={this.selectPhoto(photo)} />
        </div>
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
        <div className={`gallery gallery-${this.state.columns}`}>
          {this.renderPhotos()}
        </div>
      </>
    );
  }
}

export default App;
