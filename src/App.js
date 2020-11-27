import React from "react";
import "./App.css";
import Approval from "./approvals/approval"
import mondaySdk from "monday-sdk-js";
const monday = mondaySdk();

class App extends React.Component {
  constructor(props) {
    super(props);

    // Default state
    this.state = {
      settings: {},
      name: "",
      users: [],
      approvals: []
    };
  }

  componentDidMount() {
    monday.listen("context", res => {
      this.setState({context: res.data});

      monday.api(`query { users (kind: non_guests) { id, name, photo_tiny } }`)
      .then(res => {
        this.setState({users: res.data.users});
      });
		  monday.api('query { me { id } }').then(res => {
        this.setState({current_user: res.data.me});
      });
		  monday.api('query ($boardIds: [Int]) { boards (ids:$boardIds) { permissions, owner {id}, subscribers {id} } }', {variables:{boardIds:res.data.boardIds}}).then(res => {
        this.setState(
        	{
        		permissions: res.data.boards[0].permissions,
        		owner: res.data.boards[0].owner.id,
        	}
        );
      });
		  monday.api('query ($itemIds: [Int]) { items (ids:$itemIds) { subscribers {id} } }', {variables:{itemIds:[res.data.itemId]}}).then(res => {
        this.setState(
        	{
        		subscribers: res.data.items[0].subscribers.map(subscriber => subscriber.id)
        	}
        );
      });
	  	monday.storage.instance.getItem('approvals' + this.state.context.itemId).then(res => {
		  	let approvals = JSON.parse(res.data.value);
		  	this.setState({'approvals': approvals ? approvals : []});
		  });


    })
  }

  addApproval = (event) => {
  	monday.storage.instance.getItem('approvals' + this.state.context.itemId).then(res => {
	  	let approvals = JSON.parse(res.data.value);
	  	if (!approvals) approvals = [];
  		approvals.unshift({id: (new Date()).valueOf().toString(), status:"pending"});
  		
  		monday.storage.instance.setItem('approvals' + this.state.context.itemId, JSON.stringify(approvals));
		  this.setState({approvals: approvals});
  	});
  }

  sendNotificationToAssignee(data) {
		monday.api(
			`query ($boardIds: [Int], $itemIds: [Int]) { boards (ids:$boardIds) { name items(ids:$itemIds) { name column_values { title text } } } }`,
			 { variables: {boardIds: this.state.context.boardIds, itemIds: [this.state.context.itemId]} }
		).then(res => {
  		monday.api(`mutation ($itemId: Int!, $assignee: Int!, $message: String!) {create_notification ( 
  			user_id: $assignee,
  			target_id: $itemId,
  			target_type: Project,
  			text: $message
  		) { text } }`,
  		{ variables: {assignee:+data.assignee, itemId:this.state.context.itemId, message: "You have been assigned an approval for " + res.data.boards[0].items[0].name + " on " + res.data.boards[0].name}})
		});
	}

	approvalStatusUpdate(id, data) {
		monday.api(`mutation ($itemId: Int!, $message: String!) {create_update ( 
			item_id: $itemId,
			body: $message
		) { id } }`,
		{ variables: {itemId:this.state.context.itemId, message: "Approval from " + new Date(+id).toLocaleDateString(undefined, {day:"numeric", month:"short", year:"numeric"}) + " status changed to <strong>" + data.status + "</strong>"}})
	}

  updateApproval = (id, data) => {
  	if (data.assignee) {
  		//Assignee changed - send notification
  		this.sendNotificationToAssignee(data);
  	}
  	if(data.status) {
  		this.approvalStatusUpdate(id, data);
  	}

  	monday.storage.instance.getItem('approvals' + this.state.context.itemId).then(res => {
	  	let approvals = JSON.parse(res.data.value);
	  	let i = approvals.findIndex(approval => approval.id === id);
	  	let approval = Object.assign(approvals[i], data);
	  	approvals[i] = approval;
	  	monday.storage.instance.setItem('approvals' + this.state.context.itemId, JSON.stringify(approvals));
		  this.setState({approvals: approvals});
	  });
  }

  deleteApproval = (id) => {
  	monday.storage.instance.getItem('approvals' + this.state.context.itemId).then(res => {
	  	let approvals = JSON.parse(res.data.value);
	  	approvals = approvals.filter(approval => approval.id !== id);
  		monday.storage.instance.setItem('approvals' + this.state.context.itemId, JSON.stringify(approvals));
		  this.setState({approvals: approvals});
	  });
  }

  userCanAdd() {
  	console.log(this.state.subscribers);
  	if 			(this.state.permissions === 'everyone') return true;
  	else 			return (this.state.current_user && this.state.subscribers && this.state.subscribers.includes(this.state.current_user.id));
  }

  render() {
  	let approvalsRows = this.state.approvals.map((approval, index) =>
			    <Approval key={approval.id} approval={approval} users={this.state.users} current_user={this.state.current_user} update={this.updateApproval} delete={this.deleteApproval} userCanDelete={this.userCanAdd()} />
			  );

    return ( 
    	<div className="App">
    		<table className="table table-borderless table-sm">
    			<thead>
    				<tr>
    					<th className="text-center font-weight-normal">Created</th>
    					<th className="text-center font-weight-normal">Person</th>
    					<th className="text-center font-weight-normal">Status</th>
    					<th className="text-center font-weight-normal">Delete</th>
    				</tr>
    			</thead>

    			<tbody>
		    		{approvalsRows}
		    		<tr>
			    		<td>
						  	<button className="btn btn-link btn-block text-left text-muted" type="button" onClick={this.addApproval} disabled={!this.userCanAdd()}>
					    	  + Add
		    				</button>
			    		</td>
		    		</tr>
    			</tbody>
   		</table>
  	</div>);
  }
}

export default App;
