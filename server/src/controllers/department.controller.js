import Department from '../models/department.model.js'

export const getDepartments = async (_req, res) => {
  const departments = await Department.find().select('name -_id')
  res.json(departments.map(d => d.name))
}

export const getSubDepartments = async (req, res) => {
  const { department } = req.query
  if (!department) {
    return res.status(400).json({ message: 'Department query required' })
  }
  const dept = await Department.findOne({ name: department })
  if (!dept) {
    return res.status(404).json({ message: 'Department not found' })
  }
  res.json(dept.subDepartments || [])
}
