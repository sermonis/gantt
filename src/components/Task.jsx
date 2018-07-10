import React from 'react'
import { DragSource, DropTarget } from 'react-dnd'
import DependencyDraggble from './DependencyDraggble'
import { getEmptyImage } from 'react-dnd-html5-backend'
import _ from 'lodash'

function getStyles(props) {
  const { left, top, isDragging } = props
  const transform = `translate3d(${left - 10}px, ${top}px, 0)`

  return {
    position: 'absolute',
    transform,
    opacity: isDragging ? 0.2 : 1
  }
}

class Task extends React.PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      leftHandleDragging: false,
      rightHandleDragging: false,
      // leftDependencyHandleDragging: false,
      // rightDependencyHandleDragging: false
      hover: false
    }
    this.startPoint = React.createRef()
    this.endPoint = React.createRef()
    this.onHandleMouseMove = _.throttle(this.onHandleMouseMove, 100)
  }

  // static getDerivedStateFromProps(props, state) {
  //   this.setState({hover: props.isOver})
  // }

  componentDidMount() {
    document.addEventListener('mouseup', this.onHandleMouseUp)
    this.containerDom = document.getElementById('container')
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this.onHandleMouseUp)
  }

  onHandleMouseDown = pos => () => {
    this.setState({ [`${pos}HandleDragging`]: true })
    document.addEventListener('mousemove', this.onHandleMouseMove)
  }

  onHandleMouseUp = () => {
    if (
      !this.state.leftHandleDragging &&
      !this.state.rightHandleDragging
      // !this.state.leftDependencyHandleDragging &&
      // !this.state.rightDependencyHandleDragging
    )
      return
    this.setState({
      leftHandleDragging: false,
      rightHandleDragging: false
      // leftDependencyHandleDragging: false,
      // rightDependencyHandleDragging: false
    })
    document.removeEventListener('mousemove', this.onHandleMouseMove)
  }

  onHandleMouseMove = e => {
    if (this.state.leftHandleDragging || this.state.rightHandleDragging) {
      const unitX = this.props.boardWidth / this.props.adjustableNum
      const mouseX =
        Math.round((e.pageX + this.containerDom.scrollLeft) / unitX) * unitX + 5
      const handleWidth = 10
      const taskRight = this.props.left + handleWidth + this.props.taskBodyWidth
      if (this.state.rightHandleDragging)
        this.props.updateWidth(
          this.props.number,
          mouseX - handleWidth / 2 - this.props.left
        )
      else {
        this.props.updateWidth(
          this.props.number,
          taskRight - mouseX - handleWidth / 2
        )
        this.props.updateLeft(this.props.number, mouseX - handleWidth / 2)
      }
    }
    // else if (this.state.leftDependencyHandleDragging) {
    //   this.props.dependencyMouseMove(
    //     'left',
    //     this.props.number,
    //     e.pageX + this.containerDom.scrollLeft,
    //     e.pageY + this.containerDom.scrollTop
    //   )
    // } else if (this.state.rightDependencyHandleDragging) {
    //   this.props.dependencyMouseMove(
    //     'right',
    //     this.props.number,
    //     e.pageX + this.containerDom.scrollLeft,
    //     e.pageY + this.containerDom.scrollTop
    //   )
    // }
  }

  render() {
    return (
      <div className="task" style={getStyles(this.props)}>
        <div
          className="task-handle handle-left"
          ref={this.startPoint}
          onMouseDown={this.onHandleMouseDown('left')}
        />
        <DependencyDraggble pos="left" number={this.props.number} />
        {this.props.connectDropTarget(
          this.props.connectDragSource(
            <div
              className={`task-body${this.props.isOver ? ' hover':''}`}
              id={this.props.id}
              style={{ width: this.props.taskBodyWidth }}
            />
          )
        )}
        <DependencyDraggble pos="right" number={this.props.number} />
        <div
          className="task-handle handle-right"
          ref={this.endPoint}
          onMouseDown={this.onHandleMouseDown('right')}
        />
      </div>
    )
  }
}

export default DragSource(
  Symbol.for('Task'),
  {
    beginDrag(props, monitor, component) {
      return {
        number: props.number,
        left: props.left,
        top: props.top
      }
    }
  },
  (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  })
)(
  DropTarget(
    Symbol.for('Dependency'),
    {
      canDrop(props, monitor) {
        return props.number != monitor.getItem().number
      },
      drop(props, monitor, component) {
        // console.log(monitor.getItem())
        const item = monitor.getItem()
        if (item.pos === 'right') props.addDependency(item.number, props.number)
        else props.addDependency(props.number, item.number)
      }
    },
    (connect, monitor) => ({
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver()
    })
  )(Task)
)
