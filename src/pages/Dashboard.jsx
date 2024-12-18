// src/pages/Dashboard.jsx
import React from 'react'
import { useSelector } from 'react-redux'
import { FiDollarSign, FiRepeat, FiCheckCircle, FiPieChart, FiArrowUpCircle, FiArrowDownCircle } from 'react-icons/fi'
import BudgetCard from '../components/BudgetCard'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { deleteBudget, editBudget } from '../store/budgetSlice'
import EmptyState from '../components/EmptyState'
import { SpendingBarChart } from '../components/BudgetCharts';

const Dashboard = () => {
    const budgets = useSelector(state => state.budgets.items)
    const recurringIncome = useSelector(state => state.recurring?.income || [])
    const recurringExpenses = useSelector(state => state.recurring?.items || [])
    const dispatch = useDispatch()
    const navigate = useNavigate()

    if (budgets.length === 0) {
        return (
            <div className="w-full">
                <div className='border-b border-b-slate-300 p-6'>
                    <h2 className="text-xl text-slate-700 font-semibold">Overview</h2>
                </div>
                <EmptyState
                    icon={FiPieChart}
                    title="No budgets yet"
                    description="Create your first budget to start tracking your expenses and managing your money better."
                    actionLabel="Create Budget"
                    onAction={() => navigate('/budget')}
                />
            </div>
        )
    }

    // Get last 3 budgets
    const recentBudgets = [...budgets].sort((a, b) => b.id - a.id).slice(0, 3)

    // Get last 5 transactions across all budgets
    const recentTransactions = budgets
        .flatMap(budget =>
            budget.transactions.map(transaction => ({
                ...transaction,
                budgetName: budget.name,
                budgetId: budget.id
            }))
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)

    const analytics = {
        totalBudget: budgets.reduce((sum, budget) => sum + budget.amount, 0),
        totalSpent: budgets.reduce((sum, budget) => sum + budget.spent, 0),
        totalTransactions: budgets.reduce((sum, budget) => sum + (budget.transactions?.length || 0), 0),
        totalBudgets: budgets.length,
        completedBudgets: budgets.filter(budget => budget.spent >= budget.amount).length,
        // Calculate monthly amounts from recurring items
        monthlyIncome: recurringIncome
            .filter(item => item.isActive)
            .reduce((sum, item) => {
                const amount = Number(item.amount)
                switch(item.frequency) {
                    case 'weekly': return sum + (amount * 4)
                    case 'yearly': return sum + (amount / 12)
                    default: return sum + amount // monthly
                }
            }, 0),
        monthlyExpenses: recurringExpenses
            .filter(item => item.isActive)
            .reduce((sum, item) => {
                const amount = Number(item.amount)
                switch(item.frequency) {
                    case 'weekly': return sum + (amount * 4)
                    case 'yearly': return sum + (amount / 12)
                    default: return sum + amount // monthly
                }
            }, 0)
    }

    const cards = [
        {
            title: 'Current Balance',
            value: `${analytics.totalBudget - analytics.totalSpent}€`,
            icon: <FiDollarSign size={24} />,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500'
        },
        {
            title: 'Total Budget',
            value: `${analytics.totalBudget}€`,
            icon: <FiDollarSign size={24} />,
            color: 'bg-blue-500',
            textColor: 'text-blue-500'
        },
        {
            title: 'Total Spent',
            value: `${analytics.totalSpent}€`,
            icon: <FiRepeat size={24} />,
            color: 'bg-red-500',
            textColor: 'text-red-500'
        },
        {
            title: 'Completed Budgets',
            value: `${analytics.completedBudgets}/${analytics.totalBudgets}`,
            icon: <FiCheckCircle size={24} />,
            color: 'bg-purple-500',
            textColor: 'text-purple-500'
        },
        {
            title: 'Monthly Income',
            value: `${analytics.monthlyIncome}€`,
            icon: <FiArrowUpCircle size={24} />,
            color: 'bg-green-500',
            textColor: 'text-green-500'
        },
        {
            title: 'Monthly Expenses',
            value: `${analytics.monthlyExpenses}€`,
            icon: <FiArrowDownCircle size={24} />,
            color: 'bg-red-500',
            textColor: 'text-red-500'
        }
    ]

    const chartData = budgets.map(budget => ({
        name: budget.name,
        amount: budget.amount,
        spent: budget.spent
    }));

    return (
        <div className="w-full overflow-x-auto">
            <div className='border-b border-b-slate-300 p-6 sticky top-0 bg-slate-100 z-10'>
                <h2 className="text-xl text-slate-700 font-semibold">Overview</h2>
            </div>

            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map((card, index) => (
                        <div key={index} className="bg-white rounded-xl border border-slate-300 p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4">
                                <div className={`${card.color} bg-opacity-10 p-3 rounded-full ${card.textColor}`}>
                                    {card.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm text-slate-500">{card.title}</h3>
                                    <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 md:grid-cols-7">
                    {/* Left Column - 4 columns width */}
                    <div className="md:col-span-4 space-y-6">
                        {/* Chart Section */}
                        <div className="bg-white rounded-xl border border-slate-300 p-6">
                            <h3 className="text-lg font-semibold mb-2">Spending Overview</h3>
                            <p className="text-sm text-slate-500 mb-6">Current spending by category</p>
                            <div className="h-[250px]">
                                <SpendingBarChart data={chartData} />
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white rounded-xl border border-slate-300">
                            <div className="flex justify-between items-center p-6 border-b border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-700">Recent Transactions</h3>
                                <button
                                    onClick={() => navigate('/transactions')}
                                    className="text-sm text-slate-600 hover:text-slate-800"
                                >
                                    View All →
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="text-left p-4 text-sm text-slate-600">Description</th>
                                            <th className="text-left p-4 text-sm text-slate-600">Budget</th>
                                            <th className="text-left p-4 text-sm text-slate-600">Amount</th>
                                            <th className="text-left p-4 text-sm text-slate-600">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.map(transaction => (
                                            <tr key={transaction.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="p-4">{transaction.description}</td>
                                                <td className="p-4">{transaction.budgetName}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 bg-slate-100 rounded-full text-sm">
                                                        {transaction.amount}€
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500">
                                                    {new Date(transaction.createdAt).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Recent Budgets - 3 columns */}
                    <div className="md:col-span-3">
                        <div className="bg-white rounded-xl border border-slate-300 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-slate-700">Recent Budgets</h3>
                                <button
                                    onClick={() => navigate('/budget')}
                                    className="text-sm text-slate-600 hover:text-slate-800"
                                >
                                    View All →
                                </button>
                            </div>
                            <div className="space-y-3">
                                {recentBudgets.map(budget => (
                                    <BudgetCard
                                        key={budget.id}
                                        {...budget}
                                        transactions={budget.transactions?.length || 0}
                                        onDelete={() => dispatch(deleteBudget(budget.id))}
                                        onEdit={(updatedBudget) => dispatch(editBudget(updatedBudget))}
                                        compact={true}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Dashboard