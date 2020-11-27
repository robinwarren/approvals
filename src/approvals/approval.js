import React from "react";
import "../App.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheckCircle, faTimesCircle, faClock, faTrash } from '@fortawesome/free-solid-svg-icons'

class Approval extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
    	userCanApprove: props.approval.assignee && props.current_user ? props.current_user.id === +props.approval.assignee : false,
    };
  }

	getStatusTagColour() {
		switch (this.props.approval.status) {
			case "pending":
				return "bg-warning";

			case "Rejected":
				return "bg-danger";

			case "Approved":
				return "bg-success";

			default:
				return "bg-light";
		}
	} 

	getStatusIcon() {
		switch (this.props.approval.status) {
			case "pending":
				return faClock;

			case "Rejected":
				return faTimesCircle;

			case "Approved":
				return faCheckCircle;

			default:
				return "bg-light";
		}
	}

	update = (event) => {
		this.props.update(this.props.approval.id, {[event.target.name]:event.target.value})
	}

	delete = (event) => {
		this.props.delete(this.props.approval.id)
	}

	userCanApprove() {
		return this.props.approval.assignee && this.props.current_user ? this.props.current_user.id === +this.props.approval.assignee : false;
	}

  render() {
  	console.log(this.props.users);

		const userOptions = this.props.users.map((user) =>
		    <option key={user.id} value={user.id}>{user.name}</option>
		  );

    return ( 
	    	<tr>
	    		<td className="align-middle">
	    			<span>{new Date(+this.props.approval.id).toLocaleDateString(undefined, {day:"numeric", month:"short", year:"numeric"})}</span>
	    		</td>
	    		<td>
					  <select className="custom-select" name="assignee" id="assignee" value={this.props.approval.assignee == null ? "none" : this.props.approval.assignee} onChange={this.update} disabled={!this.props.userCanDelete}>
					  	<option value="none" disabled>select assignee</option>
					  	{userOptions}
					  </select>	
	    		</td>
	    		<td>
    				<div className="input-group">
							<div className="input-group-prepend">
						    <label className={"input-group-text " + this.getStatusTagColour()} htmlFor="assignee"><FontAwesomeIcon icon={this.getStatusIcon()} inverse /></label>
						  </div>
						  <select className={"custom-select"} name="status" id="status" value={this.props.approval.status} onChange={this.update} disabled={!this.userCanApprove()}>
						  	<option value="pending">Pending</option>
						  	<option value="Approved">Approved</option>
						  	<option value="Rejected">Rejected</option>
						  </select>
						</div>	
  	  		</td>
	    		<td className="text-center">
	    			<button className="btn btn-link text-danger" type="button" onClick={this.delete} disabled={!this.props.userCanDelete}>
				      <FontAwesomeIcon icon={faTrash} />
		    		</button>
	    		</td>
	    	</tr>
	  );
  }
}

export default Approval;