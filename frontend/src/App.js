import React from 'react';
import axios from 'axios'
import './App.css'

class App extends React.Component {
  state = {
    photos: []
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
        <img key={i} src={photo.rawUrl} alt={photo.filename} />
      )
    });
  }

  render() {
    return (
      <div className="gallery">
        {this.renderPhotos()}
      </div>
    );
  }
}

export default App;
